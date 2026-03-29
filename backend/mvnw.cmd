@REM Maven Wrapper startup batch script
@REM Adapted from Spring Initializr
@if "%DEBUG%"=="" @echo off
@setlocal

set MAVEN_PROJECTBASEDIR=%~dp0
set MAVEN_CMD_LINE_ARGS=%*

for %%i in ("%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar") do set WRAPPER_JAR="%%~fi"

if not exist %WRAPPER_JAR% (
    echo Downloading Maven Wrapper...
    powershell -Command "(New-Object Net.WebClient).DownloadFile('https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.3.2/maven-wrapper-3.3.2.jar', '%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar')"
)

set WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain
"%JAVA_HOME%\bin\java.exe" %JVM_CONFIG_MAVEN_PROPS% %MAVEN_OPTS% -cp %WRAPPER_JAR% %WRAPPER_LAUNCHER% %MAVEN_CMD_LINE_ARGS%
if ERRORLEVEL 1 goto error
goto end

:error
set ERROR_CODE=1

:end
@endlocal & set ERROR_CODE=%ERROR_CODE%
exit /B %ERROR_CODE%
