#[cfg_attr(mobile, tauri::mobile_entry_point)]

mod commands;
mod state {
    pub mod app_state;
}

use tauri::{Emitter, Manager};
use tauri::WindowEvent;
use window_vibrancy::{apply_acrylic, apply_mica};

use crate::commands::tray::setup_tray;
use crate::state::app_state::AppState;

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
            let state = AppState::new();
            app.manage(state.clone());

            setup_tray(app.handle())?;
            apply_window_effects(app.handle());

            let window = app
                .get_webview_window("main")
                .ok_or_else(|| String::from("main window not found"))?;
            let _ = window.show();

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                if let Some(state) = window.try_state::<AppState>() {
                    if state.inner().user_id.lock().is_ok() {
                        api.prevent_close();
                        let _ = window.hide();
                        let _ = window.emit("toast", "vor2 is still running in the tray.");
                    }
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::backend::get_session,
            commands::backend::clear_session,
            commands::backend::delete_account,
            commands::backend::sign_in_with_password,
            commands::backend::sign_up_with_password,
            commands::window::show_main_window,
            commands::window::hide_main_window,
            commands::window::minimize_main_window,
            commands::window::toggle_maximize_main_window,
            commands::window::get_app_settings,
            commands::window::update_app_settings,
            commands::window::set_startup_enabled,
            commands::file_dialog::open_file_dialog,
            commands::file_dialog::open_folder_dialog,
            commands::file_dialog::inspect_file_paths,
            commands::file_dialog::reveal_in_explorer,
            commands::backend::list_connections,
            commands::backend::create_connection,
            commands::backend::set_active_connection,
            commands::backend::browse_folder,
            commands::backend::create_folder,
            commands::backend::delete_object,
            commands::backend::delete_prefix,
            commands::backend::list_prefix_objects,
            commands::backend::rename_object,
            commands::backend::rename_prefix,
            commands::backend::move_object,
            commands::backend::move_prefix,
            commands::backend::search_objects,
            commands::backend::get_bucket_usage,
            commands::backend::create_presigned_get_url,
            commands::backend::enqueue_uploads,
            commands::backend::list_sync_folders,
            commands::backend::add_sync_folder,
            commands::backend::remove_sync_folder,
            commands::backend::sync_connection_folders
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

