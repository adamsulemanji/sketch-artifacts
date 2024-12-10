function doGet() {
  return HtmlService.createHtmlOutputFromFile('index');
}

function fetchUserDataInRange(startDate, endDate) {
  const sheet = SpreadsheetApp.openById('1hKgZM7_Ft_D6JYkCBa7qDD3JypTZt0BDZNYSStrmS7g');
  const sheetData = sheet.getActiveSheet();
  const email = Session.getActiveUser().getEmail();
  const userId = getUserIdByEmail(email);

  if (!userId) {
    return { error: 'User ID not found.' };
  }

  const data = sheetData.getDataRange().getValues();
  const start = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T23:59:59Z");

  const result = [];

  data.forEach((row, index) => {
    // Skip the header row if present
    if (index === 0) return; 
    const rowUserId = row[0];
    const rowTimestamp = row[1];
    if (!rowUserId || !rowTimestamp) return;

    const rowDateGMT = new Date(rowTimestamp);

    if (rowUserId == userId && rowDateGMT >= start && rowDateGMT <= end) {
      const secondaryEmotions = row[3] ? row[3].split(', ') : [];
      result.push({
        date: rowDateGMT.toLocaleDateString('en-US', { timeZone: 'GMT' }),
        time: rowDateGMT.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'GMT', hour12: false }),
        primaryEmotion: row[2] || '',
        secondaryEmotions: secondaryEmotions,
        eventDetails: row[4] || '',
        watchTag: row[5] || '',
        alcohol: row[6] || '',
        sickness: row[7] || '',
        mindfulness: row[8] || ''
      });
    }
  });

  result.sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));

  return result.length ? result : { error: 'No data found for the specified date range.' };
}

function fetchMindfulEmotionData(startDate, endDate) {
  const sheet = SpreadsheetApp.openById('1hKgZM7_Ft_D6JYkCBa7qDD3JypTZt0BDZNYSStrmS7g');
  const sheetData = sheet.getActiveSheet();
  const email = Session.getActiveUser().getEmail();
  const userId = getUserIdByEmail(email);

  if (!userId) {
    return { error: 'User ID not found.' };
  }

  const data = sheetData.getDataRange().getValues();
  const start = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T23:59:59Z");

  const primaryEmotions = ["Happy", "Sad", "Angry", "Fear", "Disgust", "Surprise"];
  const mindfulEmotionCount = {};

  // Initialize counts
  primaryEmotions.forEach(emotion => {
    mindfulEmotionCount[emotion] = 0;
  });

  const countedDates = new Set();

  data.forEach((row, index) => {
    if (index === 0) return; // Skip header
    const rowUserId = row[0];
    const rowTimestamp = row[1];
    const primaryEmotion = row[2];
    const mindfulness = row[8];

    if (!rowUserId || !rowTimestamp) return;
    const rowDate = new Date(rowTimestamp);

    if (rowUserId == userId && rowDate >= start && rowDate <= end && mindfulness === 'Yes' && primaryEmotions.includes(primaryEmotion)) {
      const dateKey = `${rowDate.toISOString().split('T')[0]}-${primaryEmotion}`;
      if (!countedDates.has(dateKey)) {
        mindfulEmotionCount[primaryEmotion]++;
        countedDates.add(dateKey);
      }
    }
  });

  return mindfulEmotionCount;
}


function fetchAggregatedData(startDate, endDate) {
  const sheet = SpreadsheetApp.openById('1hKgZM7_Ft_D6JYkCBa7qDD3JypTZt0BDZNYSStrmS7g');
  const sheetData = sheet.getActiveSheet();
  const email = Session.getActiveUser().getEmail();
  const userId = getUserIdByEmail(email);

  if (!userId) {
    return { error: 'User ID not found.' };
  }

  const data = sheetData.getDataRange().getValues();
  const start = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T23:59:59Z");
  
  const emotionCount = {};
  const mindfulnessDays = { alcohol: 0, mindfulness: 0 };
  const emotionTrends = [];
  const dates = [];

  data.forEach((row, index) => {
    // Skip the header row if present
    if (index === 0) return; 
    const rowUserId = row[0];
    const rowTimestamp = row[1];
    if (!rowUserId || !rowTimestamp) return;

    const rowDateGMT = new Date(rowTimestamp);

    if (rowUserId == userId && rowDateGMT >= start && rowDateGMT <= end) {
      const emotion = row[2] || 'Unknown';

      // Count emotions
      emotionCount[emotion] = (emotionCount[emotion] || 0) + 1;

      // Count mindfulness/alcohol days
      if (row[6] === 'Yes') mindfulnessDays.alcohol++;
      if (row[8] === 'Yes') mindfulnessDays.mindfulness++;

      // Trends
      dates.push(rowTimestamp);
      emotionTrends.push(emotion);
    }
  });

  return { emotionCount, mindfulnessDays, emotionTrends, dates };
}


function fetchMindfulEmotionData(startDate, endDate) {
  const sheet = SpreadsheetApp.openById('1hKgZM7_Ft_D6JYkCBa7qDD3JypTZt0BDZNYSStrmS7g');
  const sheetData = sheet.getActiveSheet();
  const email = Session.getActiveUser().getEmail();
  const userId = getUserIdByEmail(email);

  if (!userId) {
    return { error: 'User ID not found.' };
  }

  const data = sheetData.getDataRange().getValues();
  const start = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T23:59:59Z");

  // Define the primary emotions we care about
  const primaryEmotions = ["Happy", "Sad", "Angry", "Fear", "Disgust", "Surprise"];

  // We will store counts of mindful days by emotion
  const mindfulEmotionCount = {
    "Happy": 0,
    "Sad": 0,
    "Angry": 0,
    "Fear": 0,
    "Disgust": 0,
    "Surprise": 0
  };

  // To count distinct "days" rather than individual entries, 
  // we can keep track of which dates have already been counted per emotion.
  const countedDatesByEmotion = {
    "Happy": new Set(),
    "Sad": new Set(),
    "Angry": new Set(),
    "Fear": new Set(),
    "Disgust": new Set(),
    "Surprise": new Set()
  };

  data.forEach((row, index) => {
    if (index === 0) return; // Skip header
    const rowUserId = row[0];
    const rowTimestamp = row[1];
    const primaryEmotion = row[2];
    const mindfulness = row[8];

    if (!rowUserId || !rowTimestamp) return;
    const rowDate = new Date(rowTimestamp);
    if (rowUserId == userId && rowDate >= start && rowDate <= end) {
      if (mindfulness === 'Yes' && primaryEmotions.includes(primaryEmotion)) {
        // Convert date to a string without time to identify the day
        const dayString = rowDate.toDateString();
        // Only count once per day per emotion
        if (!countedDatesByEmotion[primaryEmotion].has(dayString)) {
          countedDatesByEmotion[primaryEmotion].add(dayString);
          mindfulEmotionCount[primaryEmotion]++;
        }
      }
    }
  });

  return mindfulEmotionCount;
}

function fetchAlcoholEmotionData(startDate, endDate) {
  const sheet = SpreadsheetApp.openById('1hKgZM7_Ft_D6JYkCBa7qDD3JypTZt0BDZNYSStrmS7g');
  const sheetData = sheet.getActiveSheet();
  const email = Session.getActiveUser().getEmail();
  const userId = getUserIdByEmail(email);

  if (!userId) {
    return { error: 'User ID not found.' };
  }

  const data = sheetData.getDataRange().getValues();
  const start = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T23:59:59Z");

  const primaryEmotions = ["Happy", "Sad", "Angry", "Fear", "Disgust", "Surprise"];
  const emotionCounts = {};

  // Initialize the counts for each emotion to 0
  primaryEmotions.forEach(emotion => {
    emotionCounts[emotion] = 0;
  });

  // Loop through the data and increment the count for each emotion
  data.forEach((row, index) => {
    if (index === 0) return; // Skip header
    const rowUserId = row[0];
    const rowTimestamp = row[1];
    const primaryEmotion = row[2];
    const alcohol = row[6];

    if (!rowUserId || !rowTimestamp) return;
    const rowDate = new Date(rowTimestamp);

    if (rowUserId == userId && rowDate >= start && rowDate <= end && alcohol === 'Yes' && primaryEmotions.includes(primaryEmotion)) {
      emotionCounts[primaryEmotion]++;
    }
  });

  return emotionCounts;
}

function getUserIdByEmail(email) {
  const emailToIdMapping = {
    "nikkiahmadi@tamu.edu": "nicu",
    "nikkiraddd@tamu.edu": "NikkiRadd",
    "adamsulemanji@tamu.edu": "Adam",
    "spencerle@tamu.edu": "Spencer"
  };

  return emailToIdMapping[email] || null;
}
