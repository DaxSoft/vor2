use tauri::{AppHandle, Manager};

#[tauri::command]
pub async fn show_main_window(app: AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| String::from("main window not found"))?;
    window.show().map_err(|err| err.to_string())?;
    window.unminimize().map_err(|err| err.to_string())?;
    window.set_focus().map_err(|err| err.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn hide_main_window(app: AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| String::from("main window not found"))?;
    window.hide().map_err(|err| err.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn set_startup_enabled(_enabled: bool) -> Result<(), String> {
    Ok(())
}
