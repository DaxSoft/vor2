use std::path::PathBuf;
use std::sync::{Arc, Mutex};

use rusqlite::Connection;

#[derive(Clone)]
pub struct AppState {
    pub db_path: Arc<PathBuf>,
    pub user_id: Arc<Mutex<Option<String>>>,
    pub upload_paused: Arc<Mutex<bool>>,
}

impl AppState {
    pub fn new(base_dir: PathBuf) -> Result<Self, String> {
        std::fs::create_dir_all(&base_dir).map_err(|err| err.to_string())?;
        let db_path = base_dir.join("r2-explorer.db");
        init_database(&db_path)?;
        Ok(Self {
            db_path: Arc::new(db_path),
            user_id: Arc::new(Mutex::new(None)),
            upload_paused: Arc::new(Mutex::new(false)),
        })
    }
}

pub fn with_connection<T>(db_path: &PathBuf, op: impl FnOnce(&Connection) -> Result<T, String>) -> Result<T, String> {
    let connection = Connection::open(db_path).map_err(|err| err.to_string())?;
    op(&connection)
}

fn init_database(db_path: &PathBuf) -> Result<(), String> {
    let connection = Connection::open(db_path).map_err(|err| err.to_string())?;
    connection.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS r2_connections (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            account_id TEXT,
            bucket_name TEXT NOT NULL,
            endpoint TEXT NOT NULL,
            public_url TEXT,
            region TEXT NOT NULL DEFAULT 'auto',
            encrypted_access_key_id TEXT NOT NULL,
            encrypted_secret_access_key TEXT NOT NULL,
            encryption_iv TEXT NOT NULL,
            encryption_tag TEXT NOT NULL,
            encryption_version INTEGER NOT NULL DEFAULT 1,
            status TEXT NOT NULL DEFAULT 'ACTIVE',
            last_connected_at TEXT,
            last_selected_path TEXT NOT NULL DEFAULT '/',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS app_settings (
            user_id TEXT PRIMARY KEY,
            active_connection_id TEXT,
            start_minimized_to_tray INTEGER NOT NULL DEFAULT 1,
            close_to_tray INTEGER NOT NULL DEFAULT 1,
            launch_at_startup INTEGER NOT NULL DEFAULT 0,
            theme TEXT NOT NULL DEFAULT 'dark',
            accent_color TEXT NOT NULL DEFAULT '#2488ff',
            sidebar_width INTEGER NOT NULL DEFAULT 284,
            details_panel_visible INTEGER NOT NULL DEFAULT 1,
            upload_panel_visible INTEGER NOT NULL DEFAULT 1,
            window_width INTEGER,
            window_height INTEGER,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS upload_history (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            connection_id TEXT NOT NULL,
            bucket_name TEXT NOT NULL,
            source_path TEXT NOT NULL,
            object_key TEXT NOT NULL,
            file_name TEXT NOT NULL,
            mime_type TEXT,
            size_bytes INTEGER NOT NULL,
            status TEXT NOT NULL,
            progress INTEGER NOT NULL DEFAULT 0,
            error_message TEXT,
            public_url TEXT,
            started_at TEXT,
            completed_at TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS auth_users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            password_salt TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        ",
    )
    .map_err(|err| err.to_string())?;
    Ok(())
}
