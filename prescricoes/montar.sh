#!/usr/bin/env bash
# Monta o APK sem Gradle nem Android Studio, só com pacotes do Ubuntu/Debian:
#   apt-get install aapt apksigner zipalign dalvik-exchange android-sdk-platform-23 default-jdk python3
# Antes, gere os dados a partir do seu PDF:  python3 extrair.py seu-drive.pdf   (precisa de: pip install pymupdf)
# uso: ./montar.sh   (gera nesta pasta Prescricoes.apk e Prescricoes.html, a versão para computador)
set -euo pipefail
cd "$(dirname "$0")"

NOME=1.0     # versão que a pessoa vê
CODIGO=1     # aumente a cada versão: o Android só instala por cima se não for menor
MINIMO=21    # Android 5.0
ALVO=34      # Android 14
ANDROID_JAR=${ANDROID_JAR:-/usr/lib/android-sdk/platforms/android-23/android.jar}
DADOS=dados/prescricoes.json
SAIDA=Prescricoes.apk
# A mesma chave de uso pessoal do app de treino: assinando sempre com ela,
# a versão nova instala por cima da antiga sem apagar favoritas e receita.
CHAVE=../app-android/chave-de-teste.jks
SENHA=android

if [ ! -f "$DADOS" ]; then
  echo "Falta $DADOS. Gere com: python3 extrair.py caminho/do/drive.pdf" >&2
  exit 1
fi

T=$(mktemp -d)   # pasta de trabalho descartável
trap 'rm -rf "$T"' EXIT
mkdir -p "$T/classes" "$T/assets" "$T/dex"

# 1. a página: web/ + dados viram um único HTML; a cópia de fora é a versão para computador
python3 montar.py "$T/assets/index.html" "$DADOS"
cp "$T/assets/index.html" Prescricoes.html

# 2. o código Java vira classes.dex (sem lambdas: o dx antigo não as converte)
javac -nowarn -Xlint:-options -source 8 -target 8 -bootclasspath "$ANDROID_JAR" -d "$T/classes" $(find src -name '*.java')
dalvik-exchange --dex --min-sdk-version=$MINIMO --output="$T/dex/classes.dex" "$T/classes"

# 3. manifesto, recursos e página num pacote; depois entra o código
aapt package -f -M AndroidManifest.xml -S res -A "$T/assets" -I "$ANDROID_JAR" \
  --min-sdk-version $MINIMO --target-sdk-version $ALVO --version-code $CODIGO --version-name $NOME \
  -F "$T/cru.apk"
(cd "$T/dex" && aapt add ../cru.apk classes.dex > /dev/null)
zipalign -f 4 "$T/cru.apk" "$T/alinhado.apk"

# 4. assinatura
if [ ! -f "$CHAVE" ]; then
  CHAVE=chave-de-teste.jks
  [ -f "$CHAVE" ] || keytool -genkeypair -keystore "$CHAVE" -storepass "$SENHA" -keypass "$SENHA" -alias prescricoes \
    -keyalg RSA -keysize 2048 -validity 20000 -dname "CN=Prescricoes"
fi
apksigner sign --ks "$CHAVE" --ks-pass "pass:$SENHA" --key-pass "pass:$SENHA" \
  --min-sdk-version $MINIMO --v4-signing-enabled false --out "$SAIDA" "$T/alinhado.apk"
apksigner verify --min-sdk-version $MINIMO "$SAIDA"
ls -l "$SAIDA" Prescricoes.html
