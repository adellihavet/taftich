
// Add global types for Google APIs to avoid 'as any'
declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

// Scopes required for the API
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

/**
 * Initializes the Google API Client (GAPI) and Google Identity Services (GIS).
 */
export const initializeGoogleApi = (apiKey: string, clientId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // If already initialized, resolve immediately
    if (gapiInited && gisInited) {
        resolve();
        return;
    }

    // Safety timeout to prevent hanging if scripts fail to load
    const timeoutId = setTimeout(() => {
        reject(new Error("Timeout: Could not load Google API scripts. Please check your internet connection."));
    }, 10000);

    const checkGapi = () => {
        if (window.gapi) {
            window.gapi.load('client', async () => {
                try {
                    await window.gapi.client.init({
                        apiKey: apiKey,
                        discoveryDocs: [DISCOVERY_DOC],
                    });
                    gapiInited = true;
                    checkResolve();
                } catch (error) {
                    clearTimeout(timeoutId);
                    reject(error);
                }
            });
        } else {
            setTimeout(checkGapi, 100);
        }
    };

    const checkGis = () => {
        if (window.google) {
            try {
                tokenClient = window.google.accounts.oauth2.initTokenClient({
                    client_id: clientId,
                    scope: SCOPES,
                    callback: '', // Defined at request time
                });
                gisInited = true;
                checkResolve();
            } catch (error) {
                clearTimeout(timeoutId);
                reject(error instanceof Error ? error : new Error(String(error)));
            }
        } else {
             setTimeout(checkGis, 100);
        }
    };

    const checkResolve = () => {
        if (gapiInited && gisInited) {
            clearTimeout(timeoutId);
            resolve();
        }
    };

    checkGapi();
    checkGis();
  });
};

/**
 * Handles the OAuth flow. Returns an Access Token.
 * @param silent If true, attempts to get token without prompt (if already consented)
 */
export const handleAuthClick = (silent: boolean = false): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) return reject(new Error("Google API not initialized"));

    tokenClient.callback = async (resp: any) => {
      if (resp.error) {
        reject(resp);
        return;
      }
      // CRITICAL: Set the token for GAPI calls
      if (window.gapi && window.gapi.client) {
        window.gapi.client.setToken(resp);
      }
      resolve();
    };

    // 'consent' forces a popup. '' (empty) tries to do it silently if possible.
    // If silent fails (e.g. consent revoked), the caller must handle retry with 'consent'.
    const promptValue = silent ? '' : 'consent';

    // If we already have a valid token in gapi client, we can skip
    const existingToken = window.gapi?.client?.getToken();
    if (silent && existingToken && Date.now() < existingToken.expires_in) {
         resolve();
         return;
    }

    tokenClient.requestAccessToken({ prompt: promptValue });
  });
};

/**
 * Wrapper specifically for silent authentication attempts on page load
 */
export const trySilentAuth = async (): Promise<boolean> => {
    try {
        await handleAuthClick(true);
        return true;
    } catch (error) {
        console.warn("Silent auth failed, user needs to click connect", error);
        return false;
    }
};

/**
 * Creates a new Spreadsheet, populates it with data, and returns the ID and URL.
 */
export const createAndPopulateSheet = async (title: string, data: (string | number)[][]) => {
    if (!window.gapi) throw new Error("Google API not loaded");

    // 1. Create Sheet
    const createResponse = await window.gapi.client.sheets.spreadsheets.create({
        properties: {
            title: title,
        },
    });
    
    const spreadsheetId = createResponse.result.spreadsheetId;
    const spreadsheetUrl = createResponse.result.spreadsheetUrl;

    // 2. Write Data
    const body = {
        values: data,
    };

    await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: 'Sheet1!A1',
        valueInputOption: 'RAW',
        resource: body,
    });

    // 3. Formatting (Optional - Make Header Bold)
    const batchUpdateBody = {
        requests: [
            {
                repeatCell: {
                    range: {
                        sheetId: 0,
                        startRowIndex: 0,
                        endRowIndex: 1
                    },
                    cell: {
                        userEnteredFormat: {
                            textFormat: { bold: true },
                            backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 }
                        }
                    },
                    fields: "userEnteredFormat(textFormat,backgroundColor)"
                }
            },
            {
                 autoResizeDimensions: {
                    dimensions: {
                        sheetId: 0,
                        dimension: "COLUMNS",
                        startIndex: 0,
                        endIndex: data[0].length
                    }
                 }
            }
        ]
    };

    await window.gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        resource: batchUpdateBody
    });

    return { spreadsheetId, spreadsheetUrl };
};

/**
 * Clears the sheet content and overwrites it with new data.
 */
export const clearAndOverwriteSheet = async (spreadsheetId: string, data: (string | number)[][]) => {
    if (!window.gapi) throw new Error("Google API not loaded");

    // 1. Clear existing data
    await window.gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId: spreadsheetId,
        range: 'Sheet1', // Clears the entire sheet content
    });

    // 2. Write Data
    const body = {
        values: data,
    };

    await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: 'Sheet1!A1',
        valueInputOption: 'RAW',
        resource: body,
    });
};

/**
 * Reads all data from the given Spreadsheet ID.
 */
export const readSheetData = async (spreadsheetId: string) => {
    if (!window.gapi) throw new Error("Google API not loaded");

    const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: 'Sheet1!A:AZ', // Read plenty of columns
    });
    
    return response.result.values;
};
