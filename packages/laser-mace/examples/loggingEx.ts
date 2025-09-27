import { log, logLevels, currentLogLevel, filterKeywords, blockKeywords, getKeyNameByValue } from "../dist";

function resetLoggingState() {
    filterKeywords.length = 0;
    blockKeywords.length = 0;
    currentLogLevel.value = logLevels.debug;
}

function logCurrentFilterState() {
    console.log("Current Filter State:", {
        filterKeywords: [...filterKeywords],
        blockKeywords: [...blockKeywords],
        currentLogLevel: getKeyNameByValue(logLevels, currentLogLevel.value),
    });
}

currentLogLevel.value = logLevels.debug;
console.log("\n--Basic log messages");
log(logLevels.debug, "Debugging the application");
log(logLevels.warning, "This is a warning");
log(logLevels.error, "Critical error occurred");

resetLoggingState();

console.log("\n--Using additional data");
log(logLevels.debug, "Fetching data from API", [], { url: "https://example.com", responseTime: "200ms" });

resetLoggingState();

console.log("\n--Filtering logs by keywords");
filterKeywords.push("network");
logCurrentFilterState();
log(logLevels.debug, "This message should be logged", ["network"]);
log(logLevels.debug, "This message should NOT be logged", ["ui"]);

resetLoggingState();

console.log("\n--Excluding logs by keywords");
log(logLevels.debug, "This message should be included");
blockKeywords.push("test");
logCurrentFilterState();
log(logLevels.debug, "This message should be excluded", ["test"]);
log(logLevels.debug, "This message should still appear", ["network"]);

resetLoggingState();

console.log("\n--Adjusting log level dynamically");
currentLogLevel.value = logLevels.warning;
logCurrentFilterState();
log(logLevels.debug, "This debug message will not appear");
log(logLevels.warning, "This warning will appear");
log(logLevels.error, "Errors will always appear");

resetLoggingState();

console.log("\n--Combining filters");
filterKeywords.push("network");
blockKeywords.push("debug");
logCurrentFilterState();
log(logLevels.debug, "This should NOT appear due to block", ["network", "debug"]);
log(logLevels.warning, "This should appear as it matches filter", ["network"]);
log(logLevels.debug, "This should NOT appear", ["debug"]);

resetLoggingState();

console.log("\n--Multiple filters with overlap");
filterKeywords.push("critical", "ui");
blockKeywords.push("test");
logCurrentFilterState();
log(logLevels.error, "This should appear", ["critical"]);
log(logLevels.warning, "This should NOT appear", ["test"]);
log(logLevels.debug, "This should appear", ["ui"]);
log(logLevels.debug, "This should NOT appear", ["other"]);

resetLoggingState();
logCurrentFilterState();
log(logLevels.debug, "All messages are now visible again");
