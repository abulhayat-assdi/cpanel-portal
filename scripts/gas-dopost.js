// =============================================================================
// API ENDPOINT FOR NEXT.JS INTEGRATION 
// =============================================================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const payload = data.payload;
    let result = {};

    if (action === "getDashboardData") {
      result = getDashboardData(payload);
    } else if (action === "getExportData") {
      result = getExportData(payload);
    } else if (action === "saveFormData") {
      result = saveFormData(payload);
    } else {
      result = { success: false, message: "Unknown action: " + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
