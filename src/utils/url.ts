import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Logger } from "./logger";

/**
 * Checks if a string is a valid URL
 */
export function isUrl(input: string): boolean {
    try {
        const url = new URL(input);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

/**
 * Downloads WSDL content from a URL and saves it to a temporary file
 * Returns the path to the temporary file
 */
export async function downloadWsdl(url: string): Promise<string> {
    if (!isUrl(url)) {
        throw new Error(`Invalid URL: ${url}`);
    }

    Logger.debug(`Downloading WSDL from: ${url}`);

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const content = await response.text();

        // Create a temporary file
        const tempDir = os.tmpdir();
        const urlObj = new URL(url);
        const filename = path.basename(urlObj.pathname) || "wsdl-file.wsdl";
        const tempFilePath = path.join(tempDir, `wsdl-tsclient-${Date.now()}-${filename}`);

        // Ensure the file has .wsdl extension
        const finalPath = tempFilePath.endsWith(".wsdl") ? tempFilePath : `${tempFilePath}.wsdl`;

        fs.writeFileSync(finalPath, content, "utf8");

        Logger.debug(`WSDL downloaded and saved to: ${finalPath}`);
        return finalPath;
    } catch (error) {
        throw new Error(`Failed to download WSDL from ${url}: ${error.message}`);
    }
}

/**
 * Cleans up a temporary WSDL file
 */
export function cleanupTempFile(filePath: string): void {
    try {
        if (fs.existsSync(filePath) && filePath.includes("wsdl-tsclient-")) {
            fs.unlinkSync(filePath);
            Logger.debug(`Temporary file cleaned up: ${filePath}`);
        }
    } catch (error) {
        Logger.warn(`Failed to cleanup temporary file ${filePath}: ${error.message}`);
    }
}
