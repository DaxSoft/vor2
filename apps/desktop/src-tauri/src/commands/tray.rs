use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager};

fn show_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

pub fn setup_tray(app: &AppHandle) -> Result<(), String> {
    let open_item = MenuItem::with_id(app, "open", "Open App", true, None::<&str>)
        .map_err(|err| err.to_string())?;
    let connections = MenuItem::with_id(app, "connections", "Connections", true, None::<&str>)
        .map_err(|err| err.to_string())?;
    let settings = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)
        .map_err(|err| err.to_string())?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>).map_err(|err| err.to_string())?;

    let menu = Menu::with_items(
        app,
        &[&open_item, &connections, &settings, &quit],
    )
    .map_err(|err| err.to_string())?;

    TrayIconBuilder::with_id("main-tray")
        .icon(
            app.default_window_icon()
                .cloned()
                .ok_or_else(|| String::from("missing tray icon"))?,
        )
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| {
            let id = event.id().0.as_str();
            match id {
                "open" => show_window(app),
                "quit" => app.exit(0),
                _ => {
                    let _ = app.emit("tray-action", id);
                    show_window(app);
                }
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_window(tray.app_handle());
            }
        })
        .build(app)
        .map_err(|err| err.to_string())?;

    Ok(())
}
