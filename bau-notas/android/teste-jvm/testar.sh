#!/usr/bin/env bash
# Roda os testes do código Java da casca Android na JVM (Robolectric).
# Precisa de JDK 17+, Maven e acesso ao Maven Central e ao repositório do Google.
set -euo pipefail
cd "$(dirname "$0")"

# O Robolectric usa bibliotecas publicadas como .aar. O Maven não sabe abrir
# esse formato (quem faz isso é o Gradle), então as classes são extraídas aqui.
mvn -B -q dependency:copy-dependencies -DincludeTypes=aar -DoutputDirectory=target/aar
rm -rf target/aar-classes target/aar-tmp
mkdir -p target/aar-classes target/aar-tmp
for aar in target/aar/*.aar; do
  if unzip -qo "$aar" classes.jar -d target/aar-tmp 2> /dev/null; then
    unzip -qo target/aar-tmp/classes.jar -d target/aar-classes -x 'META-INF/*'
    rm -f target/aar-tmp/classes.jar
  fi
done

mvn -B -q test
echo "Testes Java: tudo certo."
