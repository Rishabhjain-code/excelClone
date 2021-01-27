const $ = require("jquery");
// const dialog = require("electron").remote.dialog;
const fs = require("fs");

$("document").ready(function () {
    let db;
    let lastSelectedCell;

    // console.log("Hello");
    // to all cell add event listener of type click and what happens then
    $(".cell").on("click", function () {
        // console.log("Cell is clicked")
        // console.log(this);
        //whole div is with us know

        // DOM
        // let rn = this.getAttribute("rn");
        // let cn = this.getAttribute("cn") + 1;

        //JQuery
        // ($(this).attr("rn")) always give val in string
        let rn = (Number)($(this).attr("rn"));
        let cn = (Number)($(this).attr("cn"));
        let cellAddress = String.fromCharCode(cn + 65) + (rn + 1); //E5
        // String.toCharCode() //it converts the giving no to char
        // console.log(cellAddress);
        $("#address").val(cellAddress); //put the val in the formula side bar
        $("#formula").val(db[rn][cn].formula); //display the formula already applied to clicked cell after fetching from the database

        //CHECKING PRESENCE OF DOM
        // as electron document is available in the node as it runs in the browser thus same as if typing in the console
        // console.log(document); 
        // let list = document.querySelectorAll(".row");
        // console.log(list.length);
    })

    $(".content").on("scroll", function () {
        let top = $(this).scrollTop();
        let left = $(this).scrollLeft();

        // WRONG SYNTAX -> $(".left-col").css("left") = left;
        $(".top-row").css("top", top + "px");
        $(".top-left-cell").css("top", top + "px");
        $(".top-left-cell").css("left", left + "px");
        $(".left-col").css("left", left + "px");
    })

    $(".new").on("click", function () {
        console.log("New clicked");
        db = [];
        for (let i = 0; i < 100; i++) {
            let row = [];
            for (let j = 0; j < 26; j++) {
                let cellAddress = String.fromCharCode(65 + j) + (i + 1);
                let cellObject = {
                    name: cellAddress,
                    value: "",
                    formula: "",
                    parent: [],
                    children: []
                }
                $(`.cell[rn="${i}"][cn="${j}"]`).html("");
                // remove the complete inside
                row.push(cellObject);
            }
            db.push(row);
        }
    })

    $(".open").on("click", function () {
        console.log("open clicked");
        let filePaths = dialog.showOpenDialogSync();
        let data = fs.readFileSync(filePaths[0]);

        // sheetDb set
        sheetsDb = JSON.parse(data);

        // db set
        // db = JSON.parse(data);

        //ui update

        db = sheetsDb[0].db;
        //first sheet is opened
        for (let i = 0; i < 100; i++) {
            for (let j = 0; j < 26; j++) {
                let thatDiv = $(`.cell[rn="${i}"][cn="${j}"]`);
                thatDiv.text(db[i][j].value);
            }
        }

        // for others just add their buttons/html with proper event listener so that when they clicked they can load their respective databases

        for (let i = 1; i < sheetsDb.length; i++) {
            let sheetObject = sheetsDb[i];
            let divToBeAdded = document.createElement('div');
            let allSheets = $(".sheet");
            $(divToBeAdded).addClass("sheet");
            $(divToBeAdded).on("click", sheetClick);
            //added the event listener
            divToBeAdded.innerText = sheetObject.name;
            $(allSheets[allSheets.length - 1]).after(divToBeAdded);
        }
    })

    $(".save").on("click", function () {
        console.log("Save clicked");
        let filesPath = dialog.showSaveDialogSync();
        //it returns 1 path an array returned for open
        console.log(filesPath[0]);
        let data = JSON.stringify(sheetsDb);
        fs.writeFileSync(filesPath, data);
        alert("files save!");
    })

    //when focus is removed from cell
    $(".cell").on("blur", function () {
        //when we moved from there put the value in UI to the DB
        //if updated now
        // cell out of focus and value is changed on the cell from the ui
        // means some formula as a key is stored for that cell => formula to value
        // from div take value via.text() from input use .val()

        console.log(this);
        // this has the element with all its attribute
        lastSelectedCell = this; //to update it via formula later
        let value = $(this).text(); //in ui
        let rowId = (Number)($(this).attr("rn"));
        let colId = (Number)($(this).attr("cn"));
        let cellObject = db[rowId][colId]; // in db
        // meaqns not everytime we go away from cell do this do this only when you put diff value in the ui
        if (value != cellObject.value) { //ui val vs db value matching
            // means earlier was val due to formula that not equal to ui value meand formula to value case
            cellObject.value = value;
            if (cellObject.formula) {
                $("#formula").val("");
                removeFormula(cellObject);
            }

            //check for cirular dependency before calling update children - NOT WORKING
            let cirular = false;
            // let parents = cellObject.parent;
            // let children = cellObject.child;
            // for (let i = 0; i < parents.length; i++) {

            //     let ele = parents[i];
            //     if (children.includes(ele, 0)) {
            //         alert("Circular dependency Detected");
            //         let {
            //             rowId,
            //             colId
            //         } = getRCIdFromAddress(ele);
            //         let obj2 = db[rowId][colId];
            //         obj2.style.backgroundColor = "red";
            //         cellObject.style.backgroundColor = "red";
            //         cirular = true;
            //     }
            // }

            if (!cirular) {
                updateChildrensValue(cellObject);
                console.log(cellObject);
                console.log(db);
            }
        }

    });

    function updateRowDivHeight() {
        let rowId = $(lastSelectedCell).attr("rn");
        let thatDiv = $(`.left-col-ele[rn="${rowId}"]`);
        let height = $(lastSelectedCell).css("height");
        $(thatDiv).css("height", height + "px");
    }

    // height vertical width horizontal
    $(".cell").on("keyup", function () {
        let height = $(this).height();
        // console.log(height);
        // console.log(this);
        // it hav that whole div
        let rn = $(this).attr("rn");

        // let thatDiv = $(`.left-col-ele[rn=${rn}]`); // working
        // console.log(thatDiv);
        // thatDiv.css("height", height + "px");

        $(`.left-col-ele[rn=${rn}]`).height(height);
    });

    //IMP -> this passed automatically refers to the global object if obj called a (a will have obj = this) if a calls b then b wont have maybe

    //now jab formula pr focus krke hato then put that formula in the lsc

    $("#formula").on("blur", formulaBlurEventListener);
    $("#formula").on("keypress", function (e) {
        if (e.which == 13) {
            formulaBlurEventListener();
        }
    })

    //to give visible and invisible effect on the click
    $(".file").on("click", function () {
        console.log("active");
        $(".file-options").addClass("active");
        $(".home-options").removeClass("active");
        $(".home").removeClass("active-menu");
        $(".view").removeClass("active-menu");
    })

    $(".home").on("click", function () {
        console.log("active");
        $(".file-options").removeClass("active"); //if already not then no problem
        $(".home-options").addClass("active");
        $(".file").removeClass("active-menu");
        $(".home").addClass("active-menu");
        $(".view").removeClass("active-menu");
        $(".view-options").removeClass("active"); //if already not then no problem
    })

    $(".view").on("click", function () {
        console.log("active");
        $(".file-options").removeClass("active");
        $(".home-options").removeClass("active");
        $(".file").removeClass("active-menu");
        $(".home").removeClass("active-menu");
        $(".view").addClass("active-menu");
        $(".view-options").addClass("active");
    })


    function formulaBlurEventListener() {
        let formula = $("#formula").val();
        let address = $("#address").val(); //it will have lcs
        let {
            rowId,
            colId
        } = getRCIdFromAddress(address);
        let cellObject = db[rowId][colId];

        //means not like we saw formula and removed focus no need of update then
        if (cellObject.formula != formula) {
            removeFormula(cellObject);

            let value = solveFormula(formula, cellObject);
            //db update
            cellObject.value = "" + value; //to convert to string
            cellObject.formula = formula;
            // ui update
            // lsc having this (that div itself)

            //default 0 to updating first even then makes sense (as no children no update)(in other case by default)
            updateChildrensValue(cellObject);
            $(lastSelectedCell).text(value);
        }
        console.log(db);
    }

    //DONT USE TAB AS IT REMOVES FOCUS BUT NOT CHANGES THE ADDRESS

    function removeFormula(cellObject) {
        // console.log("REMOVE FORMULA:" + this);
        cellObject.formula = "";
        //remove its parents
        for (let i = 0; i < cellObject.parent.length; i++) {
            let parName = cellObject.parent[i];
            removeChild(cellObject, parName);
            //neccessary so that they dont call update later when they change
        }
        cellObject.parent = [];
    }

    function removeChild(cellObject, parName) {
        let {
            rowId,
            colId
        } = getRCIdFromAddress(parName);
        let parentObject = db[rowId][colId];
        parentObject.children = parentObject.children.filter(function (elem) {
            return elem != cellObject.name;
        });
        //giving filter parameter that gives true will remain in the array

    }

    function solveFormula(formula, cellObject) {
        let fComponents = formula.split(" ");
        for (let i = 0; i < fComponents.length; i++) {
            let component = fComponents[i];
            let start = component[0];

            //value from this cell i.e it represents a number
            if (start >= "A" && start <= "Z") {
                let {
                    rowId,
                    colId
                } = getRCIdFromAddress(component);
                let parentObject = db[rowId][colId];
                // cellObject taken for these 2 only
                if (cellObject) {
                    addSelfToParentsChildren(cellObject, parentObject);
                    updateSelfParentKey(cellObject, parentObject);
                }
                formula = formula.replace(component, parentObject.value);
            }
        }
        //stack infix evaluation
        let val = eval(formula);
        return val;
    }

    function updateSelfParentKey(cellObject, parentObject) {
        cellObject.parent.push(parentObject.name);
    }

    function addSelfToParentsChildren(cellObject, parentObject) {
        parentObject.children.push(cellObject.name);
    }

    //supportive for value to value changed self change depn on me as well
    //topological needed to get order of updating for ex if B1 on A1 and B2 and B2 also on A1 then we have to do B2 then B1 so topological needed bcz it will be in children list of A1 in order they got processed/updated for ex b1 then b2 then b1 on both (duplicacy is useful then)

    function updateChildrensValue(object) {
        for (let i = 0; i < object.children.length; i++) {
            let childAddress = object.children[i];
            let {
                rowId,
                colId
            } = getRCIdFromAddress(childAddress);
            let child = db[rowId][colId];
            console.log(child + child.formula);
            let value = solveFormula(child.formula);
            //db update
            db[rowId][colId].value = value;
            //ui update
            //can't use lsc need that div

            $(`.cell[rn=${rowId}][cn=${colId}]`).text(value);
            updateChildrensValue(child);
        }
        // not main value updated due to eventListener on the .cell
        //you update yours I did mine
    }

    // $(`[value="arial"]`).on("click", function () {
    //     console.log(this);
    //     $(lastSelectedCell).css("font-family", "arial");
    // })
    // $(`[value="monospace"]`).on("click", function () {
    //     $(lastSelectedCell).css("font-family", "monospace");
    // })
    // $(`[value="cursive"]`).on("click", function () {
    //     $(lastSelectedCell).css("font-family", "cursive");
    // })
    // $(`[value="sans-serif"]`).on("click", function () {
    //     $(lastSelectedCell).css("font-family", "sans-serif");
    // })

    // $("option").on("click",function(){
    //     console.log(this);
    // })

    // USE CHANGE FOR SELECT tags instead of click

    // $(".font-styling button").on("click",function(){
    //     // console.log(this);
    //     $(this).css("font")
    // })

    //these lines runs fine and added this to all the options automatically

    // let fonts = document.querySelector("#font-size");
    // fonts.addEventListener("change", function () {
    //     console.log("Hello")
    // });

    //function will be called on all objects of the select tag

    // $("#font-size option").on("change", function () {
    //     console.log(this.innerHTML); //not-works
    //     console.log(this.innerText); //-works
    //     // console.log(this.text()); no fun as text it is $(this).text //not-works
    //     console.log(lastSelectedCell);
    //     lastSelectedCell.style.fontSize = this.innerText + "px";
    // });

    // Ex - WORKS FINE
    // $('select').on('change', function () {
    //     alert(this.value);
    // });

    //NOW IT WORKS
    $('select#font-type').on('change', function () {
        let font = this.value;
        $(lastSelectedCell).css("font-family", font);

        //update height of left col as done earlier on keyup event
        let height = $(lastSelectedCell).height();
        let rn = $(lastSelectedCell).attr("rn");
        $(`.left-col-ele[rn=${rn}]`).height(height);
    })

    $('select#font-size').on('change', function () {
        let size = this.value;
        $(lastSelectedCell).css("font-size", size + "px");

        //update height of left col as done earlier on keyup event - maybe also after font styling
        let height = $(lastSelectedCell).height();
        let rn = $(lastSelectedCell).attr("rn");
        $(`.left-col-ele[rn=${rn}]`).height(height);
    })

    $(".alignment button").on("click", function () {
        let alignment = this.innerText;
        if (alignment == 'L') {
            $(lastSelectedCell).css("text-align", "left");
        } else if (alignment == 'C') {
            $(lastSelectedCell).css("text-align", "center");
        } else {
            $(lastSelectedCell).css("text-align", "right");
        }
    })

    /**MDN -> As is the case with other <input> types, there are two events that can be used to detect changes to the color value: input and change. input is fired on the <input> element every time the color changes. The change event is fired when the user dismisses the color picker. In both cases, you can determine the new value of the element by looking at its value.
     * 
    * colorPicker.addEventListener("input", updateFirst, false);
    colorPicker.addEventListener("change", watchColorPicker, false);

    function watchColorPicker(event) {
    document.querySelectorAll("p").forEach(function(p) {
        p.style.color = event.target.value;
    });
    }
     */

    document.querySelector("#cell-font").addEventListener("change", watchColorPickerFont, false);

    function watchColorPickerFont(event) {
        console.log("Hello");
        lastSelectedCell.style.color = event.target.value;
    }

    document.querySelector("#cell-background").addEventListener("change", watchColorPickerBackground, false);

    function watchColorPickerBackground(event) {
        console.log("Hello");
        lastSelectedCell.style.backgroundColor = event.target.value;
        // as in js we have nearly same name as css just no - is used use style before it and use of Camel Casing Convention
    }

    //it gives the default value instead of target one
    // $("#cell-background").on("change",function(){
    //     console.log($(this).attr("value"));
    // })

    $("#bold").on("click", function () {
        $(lastSelectedCell).css("font-weight", "bold");
    })

    $("#italic").on("click", function () {
        $(lastSelectedCell).css("font-style", "italic");
    })

    $("#underline").on("click", function () {
        $(lastSelectedCell).css("text-decoration", "underline");
    })

    let fonts = document.querySelectorAll("#font-size option");
    for (let i = 0; i < fonts.length; i++) {
        fonts[i].addEventListener("click", function () {
            console.log(this);
        })
    }

    let allDivs = document.querySelectorAll("div");
    for (let i = 0; i < allDivs.length; i++) {
        allDivs[i].spellcheck = false;
    }


    //SHEETS KO CLICK KARNE PR UNKA UI AND DB HI USE HO RHA HO
    $(".sheet").on("click", sheetClick);

    function sheetClick() {
        // this will have the element
        let allSheets = $(".sheet");
        for (let i = 0; i < allSheets.length; i++) {
            $(allSheets[i]).removeClass("active-sheet");
        }
        $(this).addClass("active-sheet");

        //getting idx of the clicked obj from sheets db
        let len = sheetsDb.length;
        let idx = 0;
        console.log($(this).text());
        for (let i = 0; i < len; i++) {
            if (sheetsDb[i].name == $(this).text()) {
                idx = i;
                break;
            }
        }

        db = sheetsDb[idx].db; //so tha aage bhi vhi use ho ussi m change aae ussi m update ho
        // as ui ek hi h bs when add remove toh uss same m hi change hota h bs db alag h taaki store hote rhe

        // console.log(db);
        for (let row = 0; row < 100; row++) {
            for (let col = 0; col < 26; col++) {
                let cellObject = db[row][col];
                let div = $(`.cell[rn="${row}"][cn="${col}"]`);
                // console.log($(div).text());
                $(div).text(cellObject.value);
            }
        }
    }

    /**
    append() - Inserts content at the end of the selected elements
    prepend() - Inserts content at the beginning of the selected elements
    after() - Inserts content after the selected elements
    before() - Inserts content before the selected elements 
    */

    $(".add-button").on("click", function () {
        let ndb = init();
        let sheetObject = {
            name: `Sheet ${sheetsDb.length+1}`,
            db: ndb
        };
        let divToBeAdded = document.createElement('div');
        let allSheets = $(".sheet");
        // removing active class from other classes
        for (let i = 0; i < allSheets.length; i++) {
            $(allSheets[i]).removeClass("active-sheet");
        }
        $(divToBeAdded).addClass("sheet");
        $(divToBeAdded).addClass("active-sheet");
        //remember to add event listener to this also as earlier code added on those which were present earlier
        $(divToBeAdded).on("click", sheetClick);
        // HERE IT GOT SHOWN IN SHEETS BAR BUT THE DB NOT LOADED AS IT WILL LOAD ON CLICKING AGAIN
        divToBeAdded.innerText = sheetObject.name;
        // console.log(divToBeAdded);
        // WRONG SYNTAX -> $(divToBeAdded).after(allSheets[allSheets.length - 1]);
        // PEHLE VO JIS K BAAD DALNA H ELEMENT THEN ELEMENT TO BE ADDED MUST BE SPECIFIED
        $(allSheets[allSheets.length - 1]).after(divToBeAdded);
        sheetsDb.push(sheetObject);
    })

    function init() {
        // cols*row(in cell address)
        // db = 26*100
        let cdb = []; //initialize database
        for (let i = 0; i < 100; i++) {
            let row = []; //ith row object
            //fills a row
            for (let j = 0; j < 26; j++) {
                let cellAddress = String.fromCharCode(65 + j) + (i + 1);
                let cellObject = {
                    name: cellAddress,
                    value: "",
                    formula: "",
                    parent: [], // depn on whom
                    children: [] //who depnd on me
                }
                row.push(cellObject); //jth cell in ith row
            }
            cdb.push(row); //ith row in cdb
        }

        //100 rows and 26 col vala db ready
        // db = [[{},{},{},],[{},{},{},],[{},{},{},]]
        // console.log(db);

        return cdb;
    }

    function getRCIdFromAddress(address) {
        let rowId = (Number)(address.substring(1) - 1); //123
        let colId = (Number)(address.charCodeAt(0) - 65); //A

        return {
            rowId: rowId,
            colId: colId
        }
    }

    db = init();
    let sheetsDb = [];
    sheetsDb.push({
        name: "Sheet 1",
        db: db
    })
})

//implemented 2

// cell blur update in database when diff value
// formula blur then apply it to the last selected cell via solveFormula (space for stack infix evaluation)

// VALUE TO VALUE
//use childrens and parents by 2 functions
/* update val to val's children that I got changed you re evalutate yourself using formula thus do in cell blur event listener
    recursive as update all b to a c on b thus dfs type code
    
    no again update children and parent update thus do properly not pass cellObject and do update only for no fallasy case
    update on db and ui also
*/

// VALUE TO FORMULA
// just update its children where formula is updated (blur event listener)

// FORMULA TO VALUE
//on off focusing of our cell

// update the value in db as in normal (cell on blur)
// if formula present still diff val means update in the ui (formula to val case)
//remove parents
// as val update so updateCHildren called object

// same time removal no need to click outside

// FORMULA TO FORMULA
// do from formula tab
// update value
// update formula
// update children of parents (remove this cell) //in children as storing direct dependency indirect handled from reursive dfs it will do itself
// update parents

//all handled just remove formula else done
// update children of parents as remove formula does that

//all above this is the core of this project

//implemented 3

//do self  CYCLE DETECTION -> A1-A2 AND A2-A1 - ORIGINAL EXCEL ALSO DOES THE CIRCULAR DEPENDENCY DETECTED
//do variable reference in document

// positoning in css very important concept

// scrolling then do fix the row and col values
// this.scrollLeft whenever we scroll down the top row and top left cell also by changing its top same for left col when move right
// change the zindex value to show one over the another
// give the absolute position from start or set it later

//now when we type more the cells got shifted as we gave them minWidth only so give them maxWidth also

// now when we add more then height of that particular row must also adjust
// add eventListener to the cell that when work done final select that cell via lsc or genric rn/cn and then set height of that rn div - via keyup event every time height modify

// center the row no (display flex , align-items:center(y axis wise) , justify-content:center apply to parent div)
// when 2 boxes then to above div then both at the center

//file menu their options like bold italic and all refer ss
// arrange then apply css then active class have display flex others none
//active menu to show which selected

//new open save work
//save work -> save the database need a dilaog box like thing use   electron.remote.dialog(before use go to main.js write after nodeIntegration enableRemoteModule : true to use it)
// dialog.showSaveDialogSync gives the file path (open the dailoag box where save location ) write there the db using fs.writeileSync after stringify to show it as object

//open m read db from given path then do ui update by traversing and doing dom manipulation

//new m empty db and update ui
// db = newDB just address copy thus every change in both DONT DO THAT
//then home options only ui designing via css change and feel

//Implemented 4 - do yourself

// functioning of home options
// adding sheets and all and content loading on reclicking 
// (need of sheets array which stores the db for all whenever we click on any we run a loop and put accordingly to specified divs)
// (on plus something like init to make a new db and put in the sheets array and do run to fill the User Interface)
// HERE IT GOT SHOWN IN SHEETS BAR BUT THE DB NOT LOADED AS IT WILL LOAD ON CLICKING AGAIN
// ON SAVE SAVE SHEETSDB INSTEAD OF DB
// modify the save open accordingly open 1st sheet add buttons for all with the event listeners so when again click on them load their respective databases

// bold italic unerline font-family font-size font-color just use lsc then apply the clicked prop to the lsc ( clicked prop via event listener to the item clicked) 

// do to
// optimise either by visited or take an extra row/col to see whether enter there or not

//do to look
//sheet add in between then remove also and no add 