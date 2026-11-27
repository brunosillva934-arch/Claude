#!/usr/bin/env bash
# Monta o APK sem Gradle nem Android Studio, só com pacotes do Ubuntu/Debian:
#   apt-get install aapt apksigner zipalign dalvik-exchange android-sdk-platform-23 default-jdk python3
# uso: ./montar.sh   (gera nesta pasta o Posologia.apk e o Posologia.html, a versão para computador)
set -euo pipefail
cd "$(dirname "$0")"

NOME=1.0     # versão que a pessoa vê
CODIGO=1     # aumente a cada versão: o Android só instala por cima se não for menor
MINIMO=21    # Android 5.0
ALVO=34      # Android 14
ANDROID_JAR=${ANDROID_JAR:-/usr/lib/android-sdk/platforms/android-23/android.jar}
SAIDA=Posologia.apk
# Chave de assinatura. NÃO vai para o repositório (.gitignore): quem tem a chave consegue assinar
# um APK que o Android aceita como atualização deste. Guarde uma cópia fora do Git; assinando
# sempre com a mesma, a versão nova instala por cima da antiga sem apagar as bulas salvas.
# Sem ela, o script cria outra, e a versão nova só instala depois de desinstalar a antiga.
CHAVE=${CHAVE:-chave-de-assinatura.jks}
SENHA=${SENHA_CHAVE:-android}

T=$(mktemp -d)   # pasta de trabalho descartável, fica em /tmp
mkdir -p "$T/classes" "$T/assets" "$T/dex"

# 1. a página: web/ vira um único HTML, com as fontes dentro; a cópia de fora é a versão para computador
python3 montar.py "$T/assets/index.html"
cp "$T/assets/index.html" Posologia.html

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
  keytool -genkeypair -keystore "$CHAVE" -storepass "$SENHA" -keypass "$SENHA" -alias posologia \
    -keyalg RSA -keysize 2048 -validity 20000 -dname "CN=Posologia"
fi
apksigner sign --ks "$CHAVE" --ks-pass "pass:$SENHA" --key-pass "pass:$SENHA" \
  --min-sdk-version $MINIMO --v4-signing-enabled false --out "$SAIDA" "$T/alinhado.apk"
apksigner verify --min-sdk-version $MINIMO "$SAIDA"
ls -l "$SAIDA"
