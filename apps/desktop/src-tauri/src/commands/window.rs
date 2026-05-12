use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Manager, WebviewWindow};

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AppSettingsDto {
    pub start_minimized_to_tray: bool,
    pub close_to_tray: bool,
    pub launch_at_startup: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateAppSettingsInput {
    pub start_minimized_to_tray: bool,
    pub close_to_tray: bool,
    pub launch_at_startup: bool,
}

static SETTINGS: Lazy<Mutex<AppSettingsDto>> = Lazy::new(|| {
    Mutex::new(AppSettingsDto {
        start_minimized_to_tray: true,
        close_to_tray: true,
        launch_at_startup: false,
    })
});

fn main_window(app: &AppHandle) -> Result<WebviewWindow, String> {
    app.get_webview_window("main")
        .ok_or_else(|| String::from("main window not found"))
}

#[tauri::command]
pub async fn show_main_window(app: AppHandle) -> Result<(), String> {
    let window = main_window(&app)?;
    window.show().map_err(|err| err.to_string())?;
    window.unminimize().map_err(|err| err.to_string())?;
    window.set_focus().map_err(|err| err.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn hide_main_window(app: AppHandle) -> Result<(), String> {
    let window = main_window(&app)?;
    window.hide().map_err(|err| err.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn minimize_main_window(app: AppHandle) -> Result<(), String> {
    let window = main_window(&app)?;
    window.minimize().map_err(|err| err.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn toggle_maximize_main_window(app: AppHandle) -> Result<(), String> {
    let window = main_window(&app)?;
    let is_maximized = window.is_maximized().map_err(|err| err.to_string())?;
    if is_maximized {
        window.unmaximize().map_err(|err| err.to_string())?;
    } else {
        window.maximize().map_err(|err| err.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn get_app_settings() -> Result<AppSettingsDto, String> {
    SETTINGS
        .lock()
        .map(|value| value.clone())
        .map_err(|_| String::from("failed to read app settings"))
}

#[tauri::command]
pub async fn update_app_settings(
    input: UpdateAppSettingsInput,
) -> Result<AppSettingsDto, String> {
    let mut settings = SETTINGS
        .lock()
        .map_err(|_| String::from("failed to update app settings"))?;
    settings.start_minimized_to_tray = input.start_minimized_to_tray;
    settings.close_to_tray = input.close_to_tray;
    settings.launch_at_startup = input.launch_at_startup;
    Ok(settings.clone())
}

#[tauri::command]
pub async fn set_startup_enabled(_enabled: bool) -> Result<(), String> {
    Ok(())
}
