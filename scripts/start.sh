#!/bin/bash

# Przejdź do katalogu głównego projektu
cd "$(dirname "$0")/.." || exit

# Załaduj nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Użyj lokalnej wersji Node.js
nvm use

# Sprawdź czy wszystkie wymagane narzędzia są zainstalowane
if ! command -v rustc &> /dev/null; then
    echo "Błąd: Brak wymaganych narzędzi. Uruchom najpierw ./scripts/install.sh"
    exit 1
fi

# Uruchom aplikację w trybie deweloperskim
echo "Uruchamianie aplikacji Tauri..."
npm run tauri dev 