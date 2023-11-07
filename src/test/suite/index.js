"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
var path = require("path");
var Mocha = require("mocha");
var glob = require("glob");
function run() {
    // Create the mocha test
    var mocha = new Mocha({
        ui: 'tdd',
        color: true
    });
    var testsRoot = path.resolve(__dirname, '..');
    return new Promise(function (c, e) {
        var testFiles = new glob.Glob("**/**.test.js", { cwd: testsRoot });
        var testFileStream = testFiles.stream();
        testFileStream.on("data", function (file) {
            mocha.addFile(path.resolve(testsRoot, file));
        });
        testFileStream.on("error", function (err) {
            e(err);
        });
        testFileStream.on("end", function () {
            try {
                // Run the mocha test
                mocha.run(function (failures) {
                    if (failures > 0) {
                        e(new Error("".concat(failures, " tests failed.")));
                    }
                    else {
                        c();
                    }
                });
            }
            catch (err) {
                console.error(err);
                e(err);
            }
        });
    });
}
exports.run = run;
