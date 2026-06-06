// ================================================================
// Config do dashboard — canal ThingSpeak PÚBLICO (sem chave necessária).
// channelId não é segredo; por isso este arquivo é versionado e usado no deploy.
// Para um canal privado, sobrescreva criando thingspeak-config.local.js (gitignored).
// ================================================================
window.thingspeakConfig = {
    channelId: "3399683",
    readApiKey: ""
};
