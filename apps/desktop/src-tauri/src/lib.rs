#[cfg_attr(mobile, tauri::mobile_entry_point)]

mod commands;
mod security {
    pub mod encryption;
    pub mod keyring;
}
mod state {
    pub mod app_state;
}

use rusqlite::params;
use tauri::{Emitter, Manager};
use tauri::WindowEvent;
use window_vibrancy::{apply_acrylic, apply_mica};

use crate::commands::tray::setup_tray;
use crate::state::app_state::{with_connection, AppState};

fn should_start_minimized(state: &AppState) -> bool {
    let user_id = match state.user_id.lock() {
        Ok(value) => value.clone().unwrap_or_else(|| String::from("local-user")),
        Err(_) => String::from("local-user"),
    };

    with_connection(state.db_path.as_ref(), |connection| {
        let mut stmt = connection
            .prepare("SELECT start_minimized_to_tray FROM app_settings WHERE user_id = ?1")
            .map_err(|err| err.to_string())?;
        let value = stmt
            .query_row(params![user_id], |row| row.get::<_, i64>(0))
            .ok();
        Ok(value.unwrap_or(1) == 1)
    })
    .unwrap_or(true)
}

fn should_close_to_tray(state: &AppState) -> bool {
    let user_id = match state.user_id.lock() {
        Ok(value) => value.clone().unwrap_or_else(|| String::from("local-user")),
        Err(_) => String::from("local-user"),
    };

    with_connection(state.db_path.as_ref(), |connection| {
        let mut stmt = connection
            .prepare("SELECT close_to_tray FROM app_settings WHERE user_id = ?1")
            .map_err(|err| err.to_string())?;
        let value = stmt
            .query_row(params![user_id], |row| row.get::<_, i64>(0))
            .ok();
        Ok(value.unwrap_or(1) == 1)
    })
    .unwrap_or(true)
}

fn apply_window_effects(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        #[cfg(target_os = "windows")]
        {
            if apply_acrylic(&window, Some((16, 22, 34, 140))).is_err() {
                let _ = apply_mica(&window, None);
            }
        }
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let data_dir = app
                .path()
                .app_data_dir()
                .map_err(|err| err.to_string())?;
            let state = AppState::new(data_dir)?;
            app.manage(state.clone());

            setup_tray(app.handle())?;
            apply_window_effects(app.handle());

            let window = app
                .get_webview_window("main")
                .ok_or_else(|| String::from("main window not found"))?;
            if should_start_minimized(&state) {
                let _ = window.hide();
            } else {
                let _ = window.show();
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                if let Some(state) = window.try_state::<AppState>() {
                    if should_close_to_tray(state.inner()) {
                        api.prevent_close();
                        let _ = window.hide();
                        let _ = window.emit("toast", "R2 Explorer is still running in the tray.");
                    }
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::auth::get_session,
            commands::auth::clear_session,
            commands::auth::delete_account,
            commands::auth::sign_in_with_password,
            commands::auth::sign_up_with_password,
            commands::crypto::encrypt_secret,
            commands::crypto::decrypt_connection,
            commands::window::show_main_window,
            commands::window::hide_main_window,
            commands::window::minimize_main_window,
            commands::window::toggle_maximize_main_window,
            commands::window::get_app_settings,
            commands::window::update_app_settings,
            commands::window::set_startup_enabled,
            commands::file_dialog::open_file_dialog,
            commands::file_dialog::inspect_file_paths,
            commands::file_dialog::reveal_in_explorer,
            commands::database::list_connections,
            commands::database::create_connection,
            commands::database::set_active_connection,
            commands::database::browse_folder,
            commands::database::create_folder,
            commands::database::enqueue_uploads
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

