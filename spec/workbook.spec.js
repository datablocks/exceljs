var fs = require("fs");
var _ = require("underscore");
var Excel = require("../excel");
var testutils = require("./testutils");

// =============================================================================
// Tests

describe("Workbook", function() {
    
    it("creates sheets with correct names", function() {
        var wb = new Excel.Workbook();
        var ws1 = wb.addWorksheet("Hello, World!");
        expect(ws1.name).toEqual("Hello, World!");
        
        var ws2 = wb.addWorksheet();
        expect(ws2.name).toMatch(/sheet\d+/);
    });
    
    it("serialises and deserialises by model", function(done) {
        var wb = testutils.createTestBook(false, Excel.Workbook);
        
        testutils.cloneByModel(wb, Excel.Workbook)
            .then(function(wb2) {
                testutils.checkTestBook(wb2, "model");
            })
            .catch(function(error) {
                console.log(error.message);
                expect(error && error.message).toBeUndefined();
            })
            .finally(function() {
                done();
            });
    });
    
    it("serializes and deserializes to xlsx file properly", function(done) {
        
        var wb = testutils.createTestBook(true, Excel.Workbook);
        //fs.writeFileSync("./testmodel.json", JSON.stringify(wb.model, null, "    "));
        
        wb.xlsx.writeFile("./wb.test.xlsx")
            .then(function() {
                var wb2 = new Excel.Workbook();
                return wb2.xlsx.readFile("./wb.test.xlsx");
            })
            .then(function(wb2) {
                testutils.checkTestBook(wb2, "xlsx", true);
            })
            .catch(function(error) {
                expect(error && error.message).toBeFalsy();
            })
            .finally(function() {
                fs.unlink("./wb.test.xlsx", function(error) {
                    expect(error && error.message).toBeFalsy();
                    done();
                });
            });
    });
    
    it("serializes row styles and columns properly", function(done) {
        var wb = new Excel.Workbook();
        var ws = wb.addWorksheet("blort");
        
        ws.columns = [
            { header: "A1", width: 10 },
            { header: "B1", width: 20, style: { font: testutils.styles.fonts.comicSansUdB16, alignment: testutils.styles.alignments[1].alignment } },
            { header: "C1", width: 30 },
        ];
        
        ws.getRow(2).font = testutils.styles.fonts.broadwayRedOutline20;
        
        ws.getCell("A2").value = "A2";
        ws.getCell("B2").value = "B2";
        ws.getCell("C2").value = "C2";
        ws.getCell("A3").value = "A3";
        ws.getCell("B3").value = "B3";
        ws.getCell("C3").value = "C3";
        
        wb.xlsx.writeFile("./wb.test.xlsx")
            .then(function() {
                var wb2 = new Excel.Workbook();
                return wb2.xlsx.readFile("./wb.test.xlsx");
            })
            .then(function(wb2) {
                var ws2 = wb2.getWorksheet("blort");
                _.each(["A1", "B1", "C1", "A2", "B2", "C2", "A3", "B3", "C3"], function(address) {
                    expect(ws2.getCell(address).value).toEqual(address);
                });
                expect(ws2.getCell("B1").font).toEqual(testutils.styles.fonts.comicSansUdB16);
                expect(ws2.getCell("B1").alignment).toEqual(testutils.styles.alignments[1].alignment);
                expect(ws2.getCell("A2").font).toEqual(testutils.styles.fonts.broadwayRedOutline20);
                expect(ws2.getCell("B2").font).toEqual(testutils.styles.fonts.broadwayRedOutline20);
                expect(ws2.getCell("C2").font).toEqual(testutils.styles.fonts.broadwayRedOutline20);                
                expect(ws2.getCell("B3").font).toEqual(testutils.styles.fonts.comicSansUdB16);
                expect(ws2.getCell("B3").alignment).toEqual(testutils.styles.alignments[1].alignment);
                
                expect(ws2.getColumn(2).font).toEqual(testutils.styles.fonts.comicSansUdB16);
                expect(ws2.getColumn(2).alignment).toEqual(testutils.styles.alignments[1].alignment);
                
                expect(ws2.getRow(2).font).toEqual(testutils.styles.fonts.broadwayRedOutline20);
            })
            .catch(function(error) {
                expect(error && error.message).toBeFalsy();
            })
            .finally(function() {
                fs.unlink("./wb.test.xlsx", function(error) {
                    expect(error && error.message).toBeFalsy();
                    done();
                });
            });
    });
    
    it("serializes and deserializes a lot of sheets to xlsx file properly", function(done) {
        var wb = new Excel.Workbook();
        var numSheets = 90;
        // add numSheets sheets
        for (i = 1; i <= numSheets; i++) {
            var ws = wb.addWorksheet("sheet" + i);
            ws.getCell("A1").value = i;
        }
        wb.xlsx.writeFile("./wb.test.xlsx")
            .then(function() {
                var wb2 = new Excel.Workbook();
                return wb2.xlsx.readFile("./wb.test.xlsx");
            })
            .then(function(wb2) {
                for (i = 1; i <= numSheets; i++) {
                    var ws2 = wb2.getWorksheet("sheet" + i);
                    expect(ws2).toBeDefined();
                    expect(ws2.getCell("A1").value).toEqual(i);
                }
            })
            .catch(function(error) {
                expect(error && error.message).toBeFalsy();
            })
            .finally(function() {
                fs.unlink("./wb.test.xlsx", function(error) {
                    expect(error && error.message).toBeFalsy();
                    done();
                });
            });
    });
    
    it("deserializes in-cell formats properly in xlsx file", function(done) {
        
        // Stream from input string
        var testData = new Buffer(inCellFormatSampleFile, 'base64');

        // Initiate the source
        var stream = require('stream');
        var bufferStream = new stream.PassThrough();

        // Write your buffer
        bufferStream.write(testData);
        bufferStream.end();
        
        var wb = new Excel.Workbook();
        wb.xlsx.read(bufferStream)
            .then(function () {
                expect(wb.worksheets[0].getCell("A1").value)
                    .toEqual(wb.worksheets[0].getCell("A2").value);
                expect(wb.worksheets[0].getCell("B1").value)
                    .toEqual(wb.worksheets[0].getCell("B2").value);
                done();
            });
    });
    
    it("serializes and deserializes to csv file properly", function(done) {
        
        var wb = testutils.createTestBook(true, Excel.Workbook);
        //fs.writeFileSync("./testmodel.json", JSON.stringify(wb.model, null, "    "));
        
        wb.csv.writeFile("./wb.test.csv")
            .then(function() {
                var wb2 = new Excel.Workbook();
                return wb2.csv.readFile("./wb.test.csv")
                    .then(function() {
                        return wb2;
                    });
            })
            .then(function(wb2) {
                testutils.checkTestBook(wb2, "csv");
            })
            .catch(function(error) {
                expect(error && error.message).toBeFalsy();
            })
            .finally(function() {
                fs.unlink("./wb.test.csv", function(error) {
                    expect(error && error.message).toBeFalsy();
                    done();
                });
            });
    });
    
    it("stores shared string values properly", function() {
        var wb = new Excel.Workbook()
        var ws = wb.addWorksheet("blort");
        
        ws.getCell("A1").value = "Hello, World!";
        
        ws.getCell("A2").value = "Hello";
        ws.getCell("B2").value = "World";
        ws.getCell("C2").value = {formula: 'CONCATENATE(A2, ", ", B2, "!")', result: "Hello, World!"};
        
        ws.getCell("A3").value = ["Hello", "World"].join(", ") + "!";
        
        // A1 and A3 should reference the same string object
        expect(ws.getCell("A1").value).toBe(ws.getCell("A3").value);
        
        // A1 and C2 should not reference the same object
        expect(ws.getCell("A1").value).toBe(ws.getCell("C2").value.result);
    });
    
    it("assigns cell types properly", function() {
        var wb = new Excel.Workbook()
        var ws = wb.addWorksheet("blort");
        
        // plain number
        ws.getCell("A1").value = 7;
        
        // simple string
        ws.getCell("B1").value = "Hello, World!";
        
        // floating point
        ws.getCell("C1").value = 3.14;
        
        // date-time
        ws.getCell("D1").value = new Date();
        
        // hyperlink
        ws.getCell("E1").value = {text: "www.google.com", hyperlink:"http://www.google.com"};
        
        // number formula
        ws.getCell("A2").value = {formula: "A1", result: 7};
        
        // string formula
        ws.getCell("B2").value = {formula: 'CONCATENATE("Hello", ", ", "World!")', result: "Hello, World!"};
        
        // date formula
        ws.getCell("C2").value = {formula: "D1", result: new Date()};
        
        expect(ws.getCell("A1").type).toEqual(Excel.ValueType.Number);
        expect(ws.getCell("B1").type).toEqual(Excel.ValueType.String);
        expect(ws.getCell("C1").type).toEqual(Excel.ValueType.Number);
        expect(ws.getCell("D1").type).toEqual(Excel.ValueType.Date);
        expect(ws.getCell("E1").type).toEqual(Excel.ValueType.Hyperlink);
        
        expect(ws.getCell("A2").type).toEqual(Excel.ValueType.Formula);
        expect(ws.getCell("B2").type).toEqual(Excel.ValueType.Formula);
        expect(ws.getCell("C2").type).toEqual(Excel.ValueType.Formula);
    });
    
    it("throws an error when xlsx file not found", function(done) {
        var wb = new Excel.Workbook();
        var success = 0;
        wb.xlsx.readFile("./wb.doesnotexist.xlsx")
            .then(function(wb) {
                success = 1;
            })
            .catch(function(error) {
                success = 2;
                // expect the right kind of error
            })
            .finally(function() {
                expect(success).toEqual(2);
                done();
            });
    });

    it("throws an error when csv file not found", function(done) {
        var wb = new Excel.Workbook();
        var success = 0;
        wb.csv.readFile("./wb.doesnotexist.csv")
            .then(function(wb) {
                success = 1;
            })
            .catch(function(error) {
                success = 2;
                // expect the right kind of error
            })
            .finally(function() {
                expect(success).toEqual(2);
                done();
            });
    });
    
});

describe("Merge Cells", function() {
    it("serialises and deserialises properly", function() {
        var wb = new Excel.Workbook()
        var ws = wb.addWorksheet("blort");
        
        // initial values
        ws.getCell("B2").value = "B2";
        
        ws.mergeCells("B2:C3");
        
        wb.xlsx.writeFile("./wb.test.xlsx")
            .then(function() {
                var wb2 = new Excel.Workbook();
                return wb2.xlsx.readFile("./wb.test.xlsx");
            })
            .then(function(wb2) {
                var ws2 = wb2.getWorksheet("blort");
                
                expect(ws2.getCell("B2").value).toEqual("B2");
                expect(ws2.getCell("B3").value).toEqual("B2");
                expect(ws2.getCell("C2").value).toEqual("B2");
                expect(ws2.getCell("C3").value).toEqual("B2");
                
                expect(ws2.getCell("B2").type).toEqual(Excel.ValueType.String);
                expect(ws2.getCell("B3").type).toEqual(Excel.ValueType.Merge);
                expect(ws2.getCell("C2").type).toEqual(Excel.ValueType.Merge);
                expect(ws2.getCell("C3").type).toEqual(Excel.ValueType.Merge);
            })
            .catch(function(error) {
                expect(error && error.message).toBeFalsy();
            })
            .finally(function() {
                fs.unlink("./wb.test.xlsx", function(error) {
                    expect(error && error.message).toBeFalsy();
                    done();
                });
            });
    });

    it("serialises and deserialises styles", function() {
        var wb = new Excel.Workbook()
        var ws = wb.addWorksheet("blort");
        
        // initial values
        var B2 = ws.getCell("B2");
        B2.value = 5;
        B2.style.font = testutils.styles.fonts.broadwayRedOutline20;
        B2.style.border = testutils.styles.borders.doubleRed;
        B2.style.fill = testutils.styles.fills.blueWhiteHGrad;
        B2.style.alignment = testutils.styles.namedAlignments.middleCentre;
        B2.style.numFmt = testutils.styles.numFmts.numFmt1;
        
        // expecting styles to be copied (see worksheet spec)
        ws.mergeCells("B2:C3");
        
        wb.xlsx.writeFile("./wb.test.xlsx")
            .then(function() {
                var wb2 = new Excel.Workbook();
                return wb2.xlsx.readFile("./wb.test.xlsx");
            })
            .then(function(wb2) {
                var ws2 = wb2.getWorksheet("blort");
                
                expect(ws2.getCell("B2").font).toEqual(testutils.styles.fonts.broadwayRedOutline20);
                expect(ws2.getCell("B2").border).toEqual(testutils.styles.borders.doubleRed);
                expect(ws2.getCell("B2").fill).toEqual(testutils.styles.fills.blueWhiteHGrad);
                expect(ws2.getCell("B2").alignment).toEqual(testutils.styles.namedAlignments.middleCentre);
                expect(ws2.getCell("B2").numFmt).toEqual(testutils.styles.numFmts.numFmt1);
                
                expect(ws2.getCell("B3").font).toEqual(testutils.styles.fonts.broadwayRedOutline20);
                expect(ws2.getCell("B3").border).toEqual(testutils.styles.borders.doubleRed);
                expect(ws2.getCell("B3").fill).toEqual(testutils.styles.fills.blueWhiteHGrad);
                expect(ws2.getCell("B3").alignment).toEqual(testutils.styles.namedAlignments.middleCentre);
                expect(ws2.getCell("B3").numFmt).toEqual(testutils.styles.numFmts.numFmt1);
                
                expect(ws2.getCell("C2").font).toEqual(testutils.styles.fonts.broadwayRedOutline20);
                expect(ws2.getCell("C2").border).toEqual(testutils.styles.borders.doubleRed);
                expect(ws2.getCell("C2").fill).toEqual(testutils.styles.fills.blueWhiteHGrad);
                expect(ws2.getCell("C2").alignment).toEqual(testutils.styles.namedAlignments.middleCentre);
                expect(ws2.getCell("C2").numFmt).toEqual(testutils.styles.numFmts.numFmt1);
                
                expect(ws2.getCell("C3").font).toEqual(testutils.styles.fonts.broadwayRedOutline20);
                expect(ws2.getCell("C3").border).toEqual(testutils.styles.borders.doubleRed);
                expect(ws2.getCell("C3").fill).toEqual(testutils.styles.fills.blueWhiteHGrad);
                expect(ws2.getCell("C3").alignment).toEqual(testutils.styles.namedAlignments.middleCentre);
                expect(ws2.getCell("C3").numFmt).toEqual(testutils.styles.numFmts.numFmt1);
                
            })
            .catch(function(error) {
                expect(error && error.message).toBeFalsy();
            })
            .finally(function() {
                fs.unlink("./wb.test.xlsx", function(error) {
                    expect(error && error.message).toBeFalsy();
                    done();
                });
            });
    });
    
});

var inCellFormatSampleFile = "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";