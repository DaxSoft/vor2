#[cfg_attr(mobile, tauri::mobile_entry_point)]
mod r2 {
  use std::collections::BTreeSet;
  use std::env;
  use std::path::{Path, PathBuf};

  use aws_config::{BehaviorVersion, Region};
  use aws_sdk_s3::config::Credentials;
  use aws_sdk_s3::primitives::DateTimeFormat;
  use aws_sdk_s3::types::{CompletedMultipartUpload, CompletedPart};
  use aws_sdk_s3::{primitives::ByteStream, Client};
  use serde::{Deserialize, Serialize};
  use tauri::Emitter;
  use tokio::fs::File;
  use tokio::io::AsyncReadExt;
  use walkdir::WalkDir;

  const MULTIPART_CHUNK_SIZE: usize = 8 * 1024 * 1024;

  #[derive(Clone, Debug)]
  pub struct R2Config {
    pub account_id: String,
    pub access_key_id: String,
    pub secret_access_key: String,
    pub bucket: String,
    pub region: String,
    pub public_base: String,
  }

  #[derive(Serialize)]
  pub struct ConnectionInfo {
    pub bucket: String,
    pub region: String,
    pub public_base: String,
  }

  #[derive(Serialize)]
  pub struct DirectoryListing {
    prefix: String,
    folders: Vec<FolderEntry>,
    files: Vec<FileEntry>,
  }

  #[derive(Serialize)]
  pub struct FolderEntry {
    key: String,
    name: String,
  }

  #[derive(Serialize)]
  pub struct FileEntry {
    key: String,
    name: String,
    size: u64,
    etag: String,
    last_modified: String,
    mime_type: String,
    public_url: String,
  }

  #[derive(Deserialize)]
  pub struct UploadRequest {
    local_path: String,
    relative_path: Option<String>,
  }

  #[derive(Serialize)]
  pub struct UploadedFile {
    key: String,
    size: u64,
    public_url: String,
  }

  #[derive(Clone, Serialize)]
  pub struct UploadProgressPayload {
    file_id: String,
    file_name: String,
    key: String,
    progress: f64,
    uploaded_bytes: u64,
    total_bytes: u64,
    status: String,
    error: Option<String>,
  }

  pub fn load_config() -> Result<R2Config, String> {
    let _ = dotenvy::dotenv();

    let account_id = env_var("R2_ACCOUNT_ID")?;
    let access_key_id = env_var("R2_ACCESS_KEY_ID")?;
    let secret_access_key = env_var("R2_SECRET_ACCESS_KEY")?;
    let bucket = env_var("R2_BUCKET")?;
    let region = env_var("R2_REGION")?;
    let public_base = normalize_public_base(&env_var("R2_PUBLIC_BASE")?);

    Ok(R2Config {
      account_id,
      access_key_id,
      secret_access_key,
      bucket,
      region,
      public_base,
    })
  }

  fn env_var(name: &str) -> Result<String, String> {
    let raw = env::var(name).map_err(|_| format!("Missing {name} in .env"))?;
    let trimmed = raw
      .split(" #")
      .next()
      .unwrap_or("")
      .trim();
    if trimmed.is_empty() {
      return Err(format!("{name} is empty in .env"));
    }
    Ok(trimmed.to_string())
  }

  fn normalize_public_base(base: &str) -> String {
    let mut value = base.trim().trim_end_matches('/').to_string();
    if !value.starts_with("http://") && !value.starts_with("https://") {
      value = format!("https://{value}");
    }
    value
  }

  fn normalize_prefix(prefix: &str) -> String {
    let normalized = prefix.trim().trim_matches('/').to_string();
    if normalized.is_empty() {
      String::new()
    } else {
      format!("{normalized}/")
    }
  }

  fn object_name(key: &str) -> String {
    key
      .trim_end_matches('/')
      .rsplit('/')
      .next()
      .unwrap_or("")
      .to_string()
  }

  pub fn public_url(config: &R2Config, key: &str) -> String {
    if key.is_empty() {
      config.public_base.clone()
    } else {
      format!("{}/{}", config.public_base, key)
    }
  }

  pub async fn client(config: &R2Config) -> Result<Client, String> {
    let creds = Credentials::new(
      config.access_key_id.clone(),
      config.secret_access_key.clone(),
      None,
      None,
      "r2-explorer",
    );

    let shared = aws_config::defaults(BehaviorVersion::latest())
      .region(Region::new(config.region.clone()))
      .credentials_provider(creds)
      .load()
      .await;

    let endpoint = format!("https://{}.r2.cloudflarestorage.com", config.account_id);

    let cfg = aws_sdk_s3::config::Builder::from(&shared)
      .endpoint_url(endpoint)
      .force_path_style(true)
      .build();

    Ok(Client::from_conf(cfg))
  }

  pub async fn list_directory_data(
    client: &Client,
    config: &R2Config,
    prefix: &str,
  ) -> Result<DirectoryListing, String> {
    let prefix = normalize_prefix(prefix);

    let mut req = client
      .list_objects_v2()
      .bucket(config.bucket.clone())
      .delimiter("/");

    if !prefix.is_empty() {
      req = req.prefix(prefix.clone());
    }

    let out = req.send().await.map_err(|e| e.to_string())?;

    let folders = out
      .common_prefixes()
      .iter()
      .filter_map(|p| p.prefix().map(str::to_string))
      .map(|folder_key| FolderEntry {
        name: object_name(&folder_key),
        key: folder_key,
      })
      .collect::<Vec<_>>();

    let files = out
      .contents()
      .iter()
      .filter_map(|obj| {
        let key = obj.key()?.to_string();
        if key.ends_with('/') || key == prefix {
          return None;
        }

        let size = obj.size().unwrap_or(0).max(0) as u64;
        let etag = obj.e_tag().unwrap_or_default().trim_matches('"').to_string();
        let last_modified = obj
          .last_modified()
          .and_then(|ts| ts.fmt(DateTimeFormat::DateTime).ok())
          .unwrap_or_default();

        let name = object_name(&key);
        let mime_type = mime_guess_from_name(&name);

        Some(FileEntry {
          key: key.clone(),
          name,
          size,
          etag,
          last_modified,
          mime_type,
          public_url: public_url(config, &key),
        })
      })
      .collect::<Vec<_>>();

    Ok(DirectoryListing {
      prefix,
      folders,
      files,
    })
  }

  fn mime_guess_from_name(name: &str) -> String {
    if let Some(ext) = name.rsplit('.').next() {
      match ext.to_lowercase().as_str() {
        "jpg" | "jpeg" => "image/jpeg".to_string(),
        "png" => "image/png".to_string(),
        "webp" => "image/webp".to_string(),
        "gif" => "image/gif".to_string(),
        "svg" => "image/svg+xml".to_string(),
        "pdf" => "application/pdf".to_string(),
        "txt" => "text/plain".to_string(),
        "json" => "application/json".to_string(),
        "csv" => "text/csv".to_string(),
        _ => "application/octet-stream".to_string(),
      }
    } else {
      "application/octet-stream".to_string()
    }
  }

  pub async fn list_tree_data(client: &Client, config: &R2Config) -> Result<Vec<String>, String> {
    let mut continuation_token: Option<String> = None;
    let mut folders = BTreeSet::new();

    loop {
      let mut req = client.list_objects_v2().bucket(config.bucket.clone());
      if let Some(token) = continuation_token.clone() {
        req = req.continuation_token(token);
      }

      let out = req.send().await.map_err(|e| e.to_string())?;

      for object in out.contents() {
        if let Some(key) = object.key() {
          let trimmed = key.trim_matches('/');
          if trimmed.is_empty() {
            continue;
          }

          let segments = trimmed.split('/').collect::<Vec<_>>();
          if segments.len() > 1 {
            for depth in 1..segments.len() {
              let parent = format!("{}/", segments[0..depth].join("/"));
              folders.insert(parent);
            }
          }

          if key.ends_with('/') {
            folders.insert(format!("{trimmed}/"));
          }
        }
      }

      if out.is_truncated().unwrap_or(false) {
        continuation_token = out.next_continuation_token().map(str::to_string);
      } else {
        break;
      }
    }

    Ok(folders.into_iter().collect())
  }

  pub fn expand_upload_entries(
    target_prefix: &str,
    entries: Vec<UploadRequest>,
  ) -> Result<Vec<(PathBuf, String)>, String> {
    let mut items = Vec::<(PathBuf, String)>::new();
    let base_prefix = normalize_prefix(target_prefix);

    for entry in entries {
      let root = PathBuf::from(entry.local_path.clone());
      if !root.exists() {
        return Err(format!("Path not found: {}", entry.local_path));
      }

      if root.is_file() {
        let file_name = root
          .file_name()
          .and_then(|name| name.to_str())
          .ok_or_else(|| format!("Invalid file name: {}", entry.local_path))?
          .to_string();

        let key = if let Some(relative) = entry.relative_path.clone() {
          object_key(&base_prefix, &relative)
        } else {
          object_key(&base_prefix, &file_name)
        };

        items.push((root, key));
        continue;
      }

      for item in WalkDir::new(&root) {
        let item = item.map_err(|e| e.to_string())?;
        if !item.path().is_file() {
          continue;
        }

        let relative = item
          .path()
          .strip_prefix(&root)
          .map_err(|e| e.to_string())?
          .to_string_lossy()
          .replace('\\', "/");

        let base_relative = if let Some(root_relative) = entry.relative_path.clone() {
          let root_relative = root_relative.trim_matches('/');
          if root_relative.is_empty() {
            relative
          } else {
            format!("{root_relative}/{relative}")
          }
        } else {
          let root_name = root
            .file_name()
            .and_then(|name| name.to_str())
            .ok_or_else(|| format!("Invalid folder name: {}", entry.local_path))?;
          format!("{root_name}/{relative}")
        };

        let key = object_key(&base_prefix, &base_relative);
        items.push((item.path().to_path_buf(), key));
      }
    }

    Ok(items)
  }

  fn object_key(prefix: &str, relative: &str) -> String {
    let relative = relative.trim_matches('/').replace('\\', "/");
    if prefix.is_empty() {
      relative
    } else {
      format!("{prefix}{relative}")
    }
  }

  pub async fn upload_single_file(
    app: &tauri::AppHandle,
    client: &Client,
    config: &R2Config,
    file_path: &Path,
    key: &str,
  ) -> Result<UploadedFile, String> {
    let metadata = tokio::fs::metadata(file_path)
      .await
      .map_err(|e| e.to_string())?;
    let total_bytes = metadata.len();

    let file_name = file_path
      .file_name()
      .and_then(|name| name.to_str())
      .unwrap_or("file")
      .to_string();
    let file_id = key.to_string();

    emit_upload_progress(
      app,
      UploadProgressPayload {
        file_id: file_id.clone(),
        file_name: file_name.clone(),
        key: key.to_string(),
        progress: 0.0,
        uploaded_bytes: 0,
        total_bytes,
        status: "uploading".to_string(),
        error: None,
      },
    );

    let upload_result = if total_bytes <= MULTIPART_CHUNK_SIZE as u64 {
      let data = tokio::fs::read(file_path)
        .await
        .map_err(|e| e.to_string())?;

      client
        .put_object()
        .bucket(config.bucket.clone())
        .key(key)
        .body(ByteStream::from(data))
        .send()
        .await
        .map_err(|e| e.to_string())?;

      Ok(())
    } else {
      multipart_upload(app, client, config, file_path, key, &file_id, &file_name, total_bytes).await
    };

    match upload_result {
      Ok(()) => {
        emit_upload_progress(
          app,
          UploadProgressPayload {
            file_id,
            file_name,
            key: key.to_string(),
            progress: 100.0,
            uploaded_bytes: total_bytes,
            total_bytes,
            status: "completed".to_string(),
            error: None,
          },
        );

        Ok(UploadedFile {
          key: key.to_string(),
          size: total_bytes,
          public_url: public_url(config, key),
        })
      }
      Err(error) => {
        emit_upload_progress(
          app,
          UploadProgressPayload {
            file_id,
            file_name,
            key: key.to_string(),
            progress: 0.0,
            uploaded_bytes: 0,
            total_bytes,
            status: "failed".to_string(),
            error: Some(error.clone()),
          },
        );
        Err(error)
      }
    }
  }

  async fn multipart_upload(
    app: &tauri::AppHandle,
    client: &Client,
    config: &R2Config,
    file_path: &Path,
    key: &str,
    file_id: &str,
    file_name: &str,
    total_bytes: u64,
  ) -> Result<(), String> {
    let create_output = client
      .create_multipart_upload()
      .bucket(config.bucket.clone())
      .key(key)
      .send()
      .await
      .map_err(|e| e.to_string())?;

    let upload_id = create_output
      .upload_id()
      .ok_or_else(|| "Missing upload id".to_string())?
      .to_string();

    let mut file = File::open(file_path).await.map_err(|e| e.to_string())?;
    let mut completed_parts = Vec::<CompletedPart>::new();
    let mut part_number: i32 = 1;
    let mut uploaded_bytes: u64 = 0;

    loop {
      let mut chunk = vec![0_u8; MULTIPART_CHUNK_SIZE];
      let bytes_read = file.read(&mut chunk).await.map_err(|e| e.to_string())?;
      if bytes_read == 0 {
        break;
      }

      chunk.truncate(bytes_read);
      let body = ByteStream::from(chunk);

      let part_output = client
        .upload_part()
        .bucket(config.bucket.clone())
        .key(key)
        .upload_id(upload_id.clone())
        .part_number(part_number)
        .body(body)
        .send()
        .await
        .map_err(|e| e.to_string());

      let part_output = match part_output {
        Ok(value) => value,
        Err(error) => {
          let _ = client
            .abort_multipart_upload()
            .bucket(config.bucket.clone())
            .key(key)
            .upload_id(upload_id.clone())
            .send()
            .await;
          return Err(error);
        }
      };

      let etag = part_output
        .e_tag()
        .ok_or_else(|| "Missing ETag in multipart response".to_string())?
        .to_string();

      completed_parts.push(
        CompletedPart::builder()
          .part_number(part_number)
          .e_tag(etag)
          .build(),
      );

      uploaded_bytes += bytes_read as u64;
      let progress = if total_bytes == 0 {
        100.0
      } else {
        (uploaded_bytes as f64 / total_bytes as f64) * 100.0
      };

      emit_upload_progress(
        app,
        UploadProgressPayload {
          file_id: file_id.to_string(),
          file_name: file_name.to_string(),
          key: key.to_string(),
          progress,
          uploaded_bytes,
          total_bytes,
          status: "uploading".to_string(),
          error: None,
        },
      );

      part_number += 1;
    }

    let multipart_upload = CompletedMultipartUpload::builder()
      .set_parts(Some(completed_parts))
      .build();

    client
      .complete_multipart_upload()
      .bucket(config.bucket.clone())
      .key(key)
      .upload_id(upload_id)
      .multipart_upload(multipart_upload)
      .send()
      .await
      .map_err(|e| e.to_string())?;

    Ok(())
  }

  fn emit_upload_progress(app: &tauri::AppHandle, payload: UploadProgressPayload) {
    let _ = app.emit("upload-progress", payload);
  }

}

use aws_sdk_s3::primitives::ByteStream;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::Emitter;
use tauri::{Manager, WindowEvent};

#[tauri::command]
async fn get_connection_info() -> Result<r2::ConnectionInfo, String> {
  let config = r2::load_config()?;
  Ok(r2::ConnectionInfo {
    bucket: config.bucket,
    region: config.region,
    public_base: config.public_base,
  })
}

#[tauri::command]
async fn list_directory(prefix: Option<String>) -> Result<r2::DirectoryListing, String> {
  let config = r2::load_config()?;
  let client = r2::client(&config).await?;
  r2::list_directory_data(&client, &config, &prefix.unwrap_or_default()).await
}

#[tauri::command]
async fn list_tree() -> Result<Vec<String>, String> {
  let config = r2::load_config()?;
  let client = r2::client(&config).await?;
  r2::list_tree_data(&client, &config).await
}

#[tauri::command]
async fn create_folder(path: String) -> Result<(), String> {
  let config = r2::load_config()?;
  let client = r2::client(&config).await?;
  let key = if path.trim().is_empty() {
    return Err("Folder path cannot be empty".to_string());
  } else {
    format!("{}/", path.trim_matches('/'))
  };

  client
    .put_object()
    .bucket(config.bucket)
    .key(key)
    .body(ByteStream::from(Vec::<u8>::new()))
    .send()
    .await
    .map_err(|e| e.to_string())?;

  Ok(())
}

#[tauri::command]
async fn upload_entries(
  app: tauri::AppHandle,
  target_prefix: String,
  entries: Vec<r2::UploadRequest>,
) -> Result<Vec<r2::UploadedFile>, String> {
  let config = r2::load_config()?;
  let client = r2::client(&config).await?;
  let upload_items = r2::expand_upload_entries(&target_prefix, entries)?;

  let mut uploaded = Vec::<r2::UploadedFile>::new();

  for (path, key) in upload_items {
    let result = r2::upload_single_file(&app, &client, &config, &path, &key).await;
    match result {
      Ok(file) => uploaded.push(file),
      Err(error) => return Err(error),
    }
  }

  Ok(uploaded)
}

fn show_and_focus_main_window(app: &tauri::AppHandle) {
  if let Some(window) = app.get_webview_window("main") {
    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_focus();
  }
}

pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      app.handle().plugin(tauri_plugin_dialog::init())?;

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      let open_i = MenuItem::with_id(app, "open", "Open App", true, None::<&str>)?;
      let recent_i = MenuItem::with_id(app, "recent", "Recent Uploads", true, None::<&str>)?;
      let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
      let menu = Menu::with_items(app, &[&open_i, &recent_i, &quit_i])?;

      let _tray = TrayIconBuilder::with_id("main-tray")
        .icon(app.default_window_icon().cloned().ok_or("Missing default icon")?)
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
          "open" => show_and_focus_main_window(app),
          "recent" => {
            show_and_focus_main_window(app);
            let _ = app.emit("open-recent-uploads", ());
          }
          "quit" => app.exit(0),
          _ => {}
        })
        .on_tray_icon_event(|tray, event| {
          if let TrayIconEvent::Click {
            button: MouseButton::Left,
            button_state: MouseButtonState::Up,
            ..
          } = event
          {
            show_and_focus_main_window(tray.app_handle());
          }
        })
        .build(app)?;

      Ok(())
    })
    .on_window_event(|window, event| {
      if let WindowEvent::CloseRequested { api, .. } = event {
        api.prevent_close();
        let _ = window.hide();
      }
    })
    .invoke_handler(tauri::generate_handler![
      get_connection_info,
      list_directory,
      list_tree,
      create_folder,
      upload_entries
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
