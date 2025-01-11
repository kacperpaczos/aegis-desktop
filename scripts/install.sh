#!/bin/bash

# Sprawdź czy nvm jest zainstalowany
if ! command -v nvm &> /dev/null; then
    echo "Instalowanie nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    
    # Załaduj nvm
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# Przejdź do katalogu głównego projektu
cd "$(dirname "$0")/.." || exit

# Utwórz plik .nvmrc z wersją LTS
node -v > .nvmrc || echo "lts/*" > .nvmrc

# Instaluj i użyj lokalnej wersji Node.js
echo "Instalowanie Node.js LTS lokalnie..."
nvm install
nvm use

# Instaluj zależności projektu
echo "Instalowanie zależności projektu..."
npm install

# Sprawdź czy Rust jest zainstalowany
if ! command -v rustc &> /dev/null; then
    echo "Instalowanie Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi

# Instaluj zależności Tauri
echo "Instalowanie zależności Tauri..."
cd src-tauri && cargo build
cd ..

echo "Instalacja zakończona pomyślnie!" 