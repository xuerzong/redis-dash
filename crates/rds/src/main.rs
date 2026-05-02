mod commands;
mod error;
mod models;
mod paths;
mod process;
mod server;
mod update;

use clap::{CommandFactory, Parser};

use crate::{
    models::{Cli, Commands},
    server::run_server,
};

#[tokio::main]
async fn main() {
    if let Err(error) = async_main().await {
        eprintln!("{error}");
        std::process::exit(1);
    }
}

async fn async_main() -> Result<(), String> {
    let cli = Cli::parse();

    match cli.command {
        Some(Commands::Start(options)) => commands::start_background_server(options).await,
        Some(Commands::Stop) => commands::stop_background_server().await,
        Some(Commands::Restart(options)) => {
            commands::stop_background_server().await?;
            commands::start_background_server(options).await
        }
        Some(Commands::Status) => {
            commands::print_status().await;
            Ok(())
        }
        Some(Commands::SelfUpdate(options)) => update::run_self_update(options).await,
        Some(Commands::Serve(options)) => run_server(options).await,
        None => {
            let mut command = Cli::command();
            command.print_help().map_err(|error| error.to_string())?;
            println!();
            Ok(())
        }
    }
}
