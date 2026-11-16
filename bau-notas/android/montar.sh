#!/usr/bin/env bash
# Monta o APK do Baú sem Gradle nem Android Studio.
#
# Precisa de: Node 20+, JDK 17+ e destes pacotes do Ubuntu/Debian:
#   sudo apt-get install aapt apksigner zipalign dalvik-exchange android-sdk-platform-23
#
# uso:
#   bash android/montar.sh              monta e assina com a chave do projeto
#   bash android/montar.sh --teste      assina com uma chave temporária (não atualiza um app já instalado)
#
# A senha da chave do projeto vem da variável BAU_SENHA_CHAVE ou do arquivo
# android/chave.senha (que nunca vai para o repositório).
set -euo pipefail
cd "$(dirname "$0")/.."

NOME=$(node -p "require('./package.json').version")   # versão que a pessoa vê
CODIGO=$(node -p "require('./android/versao.json').codigo")  # aumente a cada APK publicado
MINIMO=29   # Android 10
ALVO=34     # Android 14
PACOTE=app.bau.notas
SAIDA=Bau.apk
CHAVE=android/chave-bau.p12
APELIDO=bau
MODO=${1:-}

T=android/.montagem
CACHE=${BAU_CACHE:-$HOME/.cache/bau}
# Classes e recursos do Android 14, usados só para compilar (não entram no APK).
# Vêm do Maven Central (projeto Robolectric, mantido pelo Google) porque o
# repositório do SDK oficial não é alcançável de todo ambiente de montagem.
PLATAFORMA_VERSAO=14-robolectric-10818077
PLATAFORMA_SHA256=6be2218c6a53fe3c57bc22ebdc723edcb7270a8a6f187545708aa5c0ed813977
PLATAFORMA=$CACHE/android-all-$PLATAFORMA_VERSAO.jar
BASE_JAVA=${ANDROID_JAR_BASE:-/usr/lib/android-sdk/platforms/android-23/android.jar}

silenciar() { grep -v "Picked up JAVA_TOOL_OPTIONS" >&2 || true; }

echo "==> 1/6 Plataforma de compilação"
for f in aapt apksigner zipalign dalvik-exchange javac keytool node npm; do
  command -v "$f" > /dev/null || { echo "Falta o programa '$f' (veja o cabeçalho deste arquivo)."; exit 1; }
done
[ -f "$BASE_JAVA" ] || { echo "Falta $BASE_JAVA (pacote android-sdk-platform-23)."; exit 1; }
if [ ! -f "$PLATAFORMA" ]; then
  mkdir -p "$CACHE"
  URL=https://repo.maven.apache.org/maven2/org/robolectric/android-all/$PLATAFORMA_VERSAO/android-all-$PLATAFORMA_VERSAO.jar
  echo "    baixando $URL"
  curl -fsSL --retry 3 -o "$PLATAFORMA.parcial" "$URL"
  mv "$PLATAFORMA.parcial" "$PLATAFORMA"
fi
echo "$PLATAFORMA_SHA256  $PLATAFORMA" | sha256sum -c --quiet - || {
  echo "O arquivo da plataforma não confere com o esperado. Apague $PLATAFORMA e tente de novo."; exit 1; }

echo "==> 2/6 Página do app (React + Vite)"
[ -d node_modules ] || npm ci --no-audit --no-fund
npm run --silent build:android

echo "==> 3/6 Código Java"
rm -rf "$T"
mkdir -p "$T/classes" "$T/dex" "$T/assets/www"
cp -r dist-android/. "$T/assets/www/"
# Sem lambdas: o conversor dalvik-exchange (dx) não as traduz.
javac -nowarn -Xlint:-options -source 8 -target 8 -encoding UTF-8 \
  -bootclasspath "$PLATAFORMA:$BASE_JAVA" -d "$T/classes" $(find android/src -name '*.java') 2> >(silenciar)
dalvik-exchange --dex --min-sdk-version=$MINIMO --output="$T/dex/classes.dex" "$T/classes" 2> >(silenciar)

echo "==> 4/6 Pacote"
aapt package -f -M android/AndroidManifest.xml -S android/res -A "$T/assets" -I "$PLATAFORMA" \
  --min-sdk-version $MINIMO --target-sdk-version $ALVO --version-code "$CODIGO" --version-name "$NOME" \
  -F "$T/cru.apk"
(cd "$T/dex" && aapt add ../cru.apk classes.dex > /dev/null)
zipalign -f 4 "$T/cru.apk" "$T/alinhado.apk"

echo "==> 5/6 Assinatura"
if [ "$MODO" = "--teste" ]; then
  CHAVE=$T/chave-temporaria.p12
  SENHA=temporaria
  SAIDA=Bau-teste.apk
  keytool -genkeypair -keystore "$CHAVE" -storetype PKCS12 -storepass "$SENHA" -alias $APELIDO \
    -keyalg RSA -keysize 2048 -validity 3650 -dname "CN=Bau (chave temporaria)" 2> >(silenciar)
  echo "    ATENÇÃO: chave temporária. Este APK não instala por cima de um Baú já instalado."
else
  SENHA=${BAU_SENHA_CHAVE:-}
  [ -n "$SENHA" ] || { [ -f android/chave.senha ] && SENHA=$(tr -d '\r\n' < android/chave.senha); } || true
  if [ ! -f "$CHAVE" ]; then
    # Primeira montagem: cria a chave de assinatura do app, com senha aleatória.
    SENHA=${SENHA:-$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')}
    keytool -genkeypair -keystore "$CHAVE" -storetype PKCS12 -storepass "$SENHA" -alias $APELIDO \
      -keyalg RSA -keysize 3072 -validity 36500 -dname "CN=Bau Notas" 2> >(silenciar)
    printf '%s\n' "$SENHA" > android/chave.senha
    chmod 600 android/chave.senha
    echo "    Chave de assinatura criada em $CHAVE."
    echo "    A senha está em android/chave.senha (fora do repositório). GUARDE-A: sem ela não dá para atualizar o app."
  fi
  [ -n "$SENHA" ] || {
    echo "A senha da chave não foi informada."
    echo "Defina BAU_SENHA_CHAVE, grave-a em android/chave.senha, ou use --teste para uma chave temporária."
    exit 1; }
fi
apksigner sign --ks "$CHAVE" --ks-type PKCS12 --ks-key-alias $APELIDO --ks-pass "pass:$SENHA" --key-pass "pass:$SENHA" \
  --min-sdk-version $MINIMO --v4-signing-enabled false --out "$SAIDA" "$T/alinhado.apk" 2> >(silenciar)
rm -f "$SAIDA.idsig"

echo "==> 6/6 Conferência"
apksigner verify --min-sdk-version $MINIMO "$SAIDA" 2> >(silenciar)
PERMISSOES=$(aapt dump permissions "$SAIDA" | grep -c "permission" || true)
if [ "$PERMISSOES" != "0" ]; then
  echo "ERRO: o APK declara permissões, e não deveria declarar nenhuma:"
  aapt dump permissions "$SAIDA"
  exit 1
fi
aapt dump xmltree "$SAIDA" AndroidManifest.xml > "$T/manifesto.txt"
grep -q 'android:allowBackup(0x01010280)=(type 0x12)0x0' "$T/manifesto.txt" || { echo "ERRO: allowBackup não está desligado."; exit 1; }
grep -q 'android:dataExtractionRules' "$T/manifesto.txt" || { echo "ERRO: faltam as regras de extração de dados."; exit 1; }
echo "    Nenhuma permissão declarada (sem INTERNET). Backup em nuvem desligado."
echo "    Certificado: $(apksigner verify --print-certs --min-sdk-version $MINIMO "$SAIDA" 2> /dev/null | sed -n 's/^Signer #1 certificate SHA-256 digest: //p')"
aapt dump badging "$SAIDA" | sed -n "s/^package: name='\([^']*\)' versionCode='\([^']*\)' versionName='\([^']*\)'.*/    \1  versão \3 (código \2)/p"
ls -l "$SAIDA" | awk '{printf "    %s  %.1f MB\n", $NF, $5/1048576}'
