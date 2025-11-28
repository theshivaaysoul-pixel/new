import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, limit, query, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        let report = "FIREBASE FIRESTORE DATABASE STRUCTURE\n";
        report += "Generated at: " + new Date().toLocaleString() + "\n";
        report += "=========================================\n\n";

        // Helper to scan a collection
        const scanCollection = async (collectionName, parentPath = "") => {
            const fullPath = parentPath ? `${parentPath}/${collectionName}` : collectionName;
            report += `COLLECTION: ${fullPath}\n`;

            try {
                // Fetch up to 5 docs to find a good sample with most fields
                let q = query(collection(db, fullPath), limit(5));
                const snapshot = await getDocs(q);

                if (snapshot.empty) {
                    report += "  (Empty Collection or Not Found)\n\n";
                    return false;
                }

                // Find doc with most keys to use as sample
                const sampleDoc = snapshot.docs.reduce((prev, current) => {
                    return Object.keys(current.data()).length > Object.keys(prev.data()).length ? current : prev;
                }, snapshot.docs[0]);

                const docData = sampleDoc.data();

                report += "  Sample Document Fields:\n";
                Object.keys(docData).forEach(key => {
                    const value = docData[key];
                    let type = typeof value;
                    let displayValue = "";

                    if (value === null) {
                        type = "null";
                        displayValue = "null";
                    } else if (Array.isArray(value)) {
                        type = "array";
                        displayValue = `[Length: ${value.length}]`;
                    } else if (value?.seconds) {
                        type = "timestamp";
                        displayValue = new Date(value.seconds * 1000).toISOString();
                    } else if (typeof value === 'object') {
                        type = "object";
                        displayValue = "{...}";
                    } else {
                        displayValue = String(value).substring(0, 50);
                        if (String(value).length > 50) displayValue += "...";
                    }

                    report += `    - ${key}: ${type} (Sample: "${displayValue}")\n`;
                });
                report += "\n";
                return true;
            } catch (error) {
                report += `  Error scanning: ${error.message}\n\n`;
                return false;
            }
        };

        // 1. Sellers
        const sellersSnapshot = await getDocs(query(collection(db, "sellers"), limit(10)));

        if (sellersSnapshot.empty) {
            report += "COLLECTION: sellers\n  (Empty Collection)\n\n";
        } else {
            // Find seller with most data
            const firstSeller = sellersSnapshot.docs[0];
            report += "COLLECTION: sellers\n";
            report += "  Sample Document Fields:\n";
            Object.keys(firstSeller.data()).forEach(key => {
                const val = firstSeller.data()[key];
                let displayVal = typeof val === 'object' ? JSON.stringify(val).substring(0, 30) + "..." : val;
                report += `    - ${key}: ${typeof val} (Sample: "${displayVal}")\n`;
            });
            report += "\n";

            // Scan sub-collections
            let servicesFound = false;
            let availabilityFound = false;

            for (const doc of sellersSnapshot.docs) {
                if (!servicesFound) {
                    const found = await scanCollection("services", `sellers/${doc.id}`);
                    if (found) servicesFound = true;
                }
                if (!availabilityFound) {
                    const found = await scanCollection("availability", `sellers/${doc.id}`);
                    if (found) availabilityFound = true;
                }
                if (servicesFound && availabilityFound) break;
            }

            if (!servicesFound) report += "COLLECTION: sellers/{id}/services\n  (No services found in scanned sellers)\n\n";
            if (!availabilityFound) report += "COLLECTION: sellers/{id}/availability\n  (No availability found in scanned sellers)\n\n";
        }

        // 2. Products
        await scanCollection("products");

        // 3. Reviews
        await scanCollection("reviews");

        // 4. Chats
        await scanCollection("chats");

        // 5. Bookings
        await scanCollection("bookings");

        // 6. Orders (New)
        await scanCollection("orders");

        // 7. Users (New)
        await scanCollection("users");

        // Write to file
        const filePath = path.join(process.cwd(), 'database_structure.txt');
        fs.writeFileSync(filePath, report);

        return NextResponse.json({
            success: true,
            message: "Database structure generated successfully.",
            path: filePath,
            content: report
        });

    } catch (error) {
        console.error("Error generating DB docs:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
