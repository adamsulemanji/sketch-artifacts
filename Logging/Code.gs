function doGet(e) {
  return HtmlService.createTemplateFromFile('form')
      .evaluate()
      .setTitle('Emotion Logger')
      .setFaviconUrl('https://www.google.com/images/favicon.ico')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

const emailToIdMapping = {
  "nikkiahmadi@tamu.edu": "nicu",
  "nikkiraddd@tamu.edu": "NikkiRadd",
  "adamsulemanji@tamu.edu": "Adam",
  "spencerle@tamu.edu": "Spencer"
};

function getParticipantId() {
  const email = Session.getActiveUser().getEmail();
  return emailToIdMapping[email] || null;
}

function logEvent(formData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  try {
    sheet.appendRow([
      getParticipantId(),
      new Date(formData.eventTime).toISOString(),
      formData.primaryEmotion,
      formData.secondaryEmotions.join(","),
      formData.eventDetails,
      formData.taggedWatch ? "Yes" : "No",
      formData.alcoholicDrinks || "N/A",
      formData.feelingSick || "N/A",
      formData.meditation || "N/A"
    ]);
    
    return { success: true };
  } catch (error) {
    Logger.log(error);
    throw new Error('Failed to log event: ' + error.message);
  }
}