let withComments;           
let codeSegmentStart;            
let withoutComments = new Array();
let branchDest = new Map();
let valueMapping = new Map();
let lineNumber =0;
let dataLocation = 0;
let arrayNames = new Array();
let dataValues = new Array();
let varibleNames = new Array();

let machineCode = "";

let instructionSet = ["NOOP","INPUTC","INPUTCF","INPUTD","INPUTDF",
"MOVE","LOADI","LOADP","ADD","ADDI","SUB","SUBI",
"LOAD","LOADF","STORE","STOREF",
"SHIFTL","SHIFTR","CMP","JUMP","BRE","BRNE","BRG","BRGE"];

let instructionFormat = ["0000_", // NOOP
"0001_", // INPUTC
"0001_", // INPUTCF
"0001_", // INPUTD
"0001_", // INPUTDF
"0010_", // MOVE
"0011_", // LOADI
"0011_", // LOADP

"0100_", // ADD
"0101_", // ADDI
"0110_", // SUB
"0111_", // SUBI

"1000_", // LOAD
"1001_", // LOADF
"1010_", // STORE
"1011_", // STOREF

"1100_", // SHIFTL
"1100_", // SHIFTR
"1101_", // CMP
"1110_", // JUMP
"1111_", // BRE_BRZ
"1111_", // BRNE_BRNZ
"1111_", // BRG
"1111_"  // BRGE
];


window.onload = function() {
    let fileInput = document.getElementById('fileInput');
    let fileDisplayArea = document.getElementById('fileDisplayArea');

		fileInput.addEventListener('change', function(e) {
			let file = fileInput.files[0];
		
            let reader = new FileReader();
                //Pass each line to the remove comments function
				reader.onload = function(e) {
                    fileDisplayArea.innerText = reader.result;
                    let lines = this.result.split('\n');
                    removeComments(lines);
				}

                reader.readAsText(file);	
		});
}

//--------------------Below deals with all of the data in the .data portion-----------
/**
 * Finds all the data after .data and passes it to be proccessed
 */
function findDataStart(code){
    for(let i =0; i< code.length; i++){
        lineNumber++;
        let lineRead = code[i];
        if(lineRead.localeCompare(".data") == 0){
            parseDataSegment(code);
            break;
        }else{
            alert("Expecting (.data) ");
        }
    }
}
/**
 * Parse the code after data
 */
function parseDataSegment(code){
    for(let i=0; i < code.length; i++){
        lineNumber++;
        let asmLine = code[i];
        if(asmLine.localeCompare(".code") == 0){
            break;
        }else if(asmLine.localeCompare(".data") == 0){
            continue;
        }
        assignDataVariable(code[i]);

    }
}
/**
 * Setting up the varibles that are contained in data
 * 
 */
function assignDataVariable(code){
    let lineParts = code.split(" ");    //Break up the instrcution and get rid of white space
    lineParts = removeEmpty(lineParts);
    let varibleName = lineParts[0];
    valueMapping.set(varibleName,dataLocation);
    let BYTE = lineParts[1];
    if(BYTE.localeCompare("BYTE") == 1){
        alert("Expected data type BYTE");
    }
    for(let i =2; i < lineParts.length; i++){
        let innerString = lineParts[i];
        if(innerString.localeCompare(",") == 0){
            arrayNames.push(varibleName);
            continue;
        }
        else if(innerString.localeCompare("?") == 0){
            dataLocation++;
            dataValues.push(0);
            varibleNames.push(varibleName);
        }else{
            if(!isNaN(innerString)){
                dataLocation++;
                dataValues.push(innerString);
                varibleNames.push(varibleName);
            }else{
                alert("Expecting numberical value, instead recieved " + innerString);
            }
        }
    }
    if(varibleNames.length >16 ){
        alert("YOU HAVE MORE THAN 16 BYTES IN YOUR DATA SEGMENT!");
    }

}
/**
 * Looks at the code segment and uses getOpCodeBits to get machine code and 
 * call a given funciton to complete the instruction
 */
function parseCodeSegment(code){
    codeSegmentStart = lineNumber -1;
    
    for(let i =codeSegmentStart; i < code.length; i++){
        lineNumber ++;
        let lineScanner = code[i].split(" ");
        lineScanner = removeEmpty(lineScanner);

        let opcode = lineScanner[0];
        if(opcode.localeCompare("NOOP") == 0){
            getOpCodeBits("NOOP");
            parseNOOP();
        }
        else if(opcode.localeCompare("LOADI") == 0){
            getOpCodeBits("LOADI");
            parseLOADI(lineScanner);
        }
        else if(opcode.localeCompare("LOADP") == 0){
            getOpCodeBits("LOADP");
            //parseLOADP(lineScanner);
        }
        else if(opcode.localeCompare("CMP")== 0){
            getOpCodeBits("CMP");
            parseCMP(lineScanner);
        }
        else if(opcode.localeCompare("LOAD") ==0){
            getOpCodeBits("LOAD");
            parseLOAD(lineScanner);
        }
        else if(opcode.localeCompare("STORE")== 0){
            getOpCodeBits("STORE");
            //parseSTORE(lineScanner);
        }
        else if(opcode.localeCompare("STOREF") == 0){
            getOpCodeBits("STOREF");
            parseSTOREF(lineScanner);
        }
        else if(opcode.localeCompare("LOADF") == 0){
            getOpCodeBits("LOADF");
            parseLOADF(lineScanner);
        }
        else if(opcode.localeCompare("INPUT") == 0){
            getOpCodeBits("INPUT");
            //parseINPUT(lineScanner);
        }
        else if(opcode.localeCompare("BRE") == 0 || opcode.localeCompare("BRZ") ==0){
            getOpCodeBits("BRE");
            //parseBRE(lineScanner, lineNumber - codeSegmentStart);
        }
        else if(opcode.localeCompare("BRNE") ==0 || opcode.localeCompare("BRNZ") ==0){
            getOpCodeBits("BRNE");
            //parseBRNE(lineScanner, lineNumber - codeSegmentStart);
        }
        else if(opcode.localeCompare("BRG") == 0){
            getOpCodeBits("BRG");
            //parseBRG(lineScanner,lineNumber - codeSegmentStart);
        }
        else if(opcode.localeCompare("BRGE") == 0){
            getOpCodeBits("BRGE");
            parseBRGE(lineScanner,lineNumber - codeSegmentStart -1);
        }
        else if(opcode.localeCompare("JUMP") ==0){
            getOpCodeBits("JUMP");
            parseJUMP(lineScanner,lineNumber - codeSegmentStart);
        }
        else if(opcode.localeCompare("ADD") == 0){
            getOpCodeBits("ADD");
            //parseADD(lineScanner);
        }
        else if(opcode.localeCompare("ADDI") == 0){
            getOpCodeBits("ADDI");
            parseADDI(lineScanner);
        }
        else if(opcode.localeCompare("SUB") == 0){
            getOpCodeBits("SUB");
            //parseSUB(lineScanner);
        }
        else if(opcode.localeCompare("SUBI") == 0){
            getOpCodeBits("SUBI");
            //parseSUBI(lineScanner);
        }
        else if(opcode.localeCompare("MOVE") == 0){
            getOpCodeBits("MOVE");
            //parseMOVE(lineScanner);
        }
        else if(opcode.localeCompare("INPUTC") == 0){
            getOpCodeBits("INPUTC");
            //parseINPUTC(lineScanner);
        }
        else if(opcode.localeCompare("INPUTCF") ==0){
            getOpCodeBits("INPUTCF");
            //parseINPUTCF(lineScanner);
        }
        else if(opcode.localeCompare("INPUTD") ==0){
            getOpCodeBits("INPUTD");
            //parseINPUTD(lineScanner);
        }
        else if(opcode.localeCompare("INPUTDF") == 0){
            getOpCodeBits("INPUTDF");
            //parseINPUTDF(lineScanner);
        }
        else if(opcode.localeCompare("SHIFTL") ==0){
            getOpCodeBits("SHIFTL");
            //parseSHIFTL(lineScanner);
        }
        else if(opcode.localeCompare("SHIFTR") == 0){
            getOpCodeBits("SHIFTR");
            //parseSHIFTR(lineScanner);
        }
        else{
            errorMessage("Invalid opcode: " + opcode + " ");
        }
    }


}

/*
 * All lines after .code should start with a jump label (EX:) or opcode.
 * This method creates jump labels while simultaneously checking for incorrect tokens.
 * 
 */
function getJumps(withoutComments){
    let lineCount =0;
    let codeRead = false;
    let toReturn = new Array();
    let count =0;
    for(let i=0; i< withoutComments.length; i++){
        let line = withoutComments[i];
        if(line.includes(".code")){
            lineCount =-1;
            codeRead = true;
            toReturn[count] =".code";
            
        }
        else if(line.includes(":")){
            //Water is warm
            branchDest.set(line.substring(0,line.indexOf(":")),lineCount);
            toReturn[count] = line.substring(line.indexOf(":")+1, line.length);
            
        }
        else{
            if(codeRead){
                let findOpCode = line.split(" ");
                findOpCode = removeEmpty(findOpCode); //To remove blank spots in array
                let validOpCode = false;
                let validString = false;
                let firstToken = "";
                for(let j=0; j<findOpCode.length; j++){
                    firstToken = findOpCode[j];
                    validString = true;
                    for(let k = 0; k < instructionSet.length; k++){
                        if(firstToken.localeCompare(instructionSet[k]) == 0){
                            validOpCode = true;
                            break;
                        }
                    }
                }
                if(!validOpCode && validString){
                    window.alert("Did you forget a colon(:) after your label? Incorrect token \""+ firstToken + "\" \n at line \"" + line + "\"");
                    exit();
                }
            }
            toReturn[i] = line;
        }
        count ++;
        lineCount++;
        
    }
    return toReturn;
}
//-------------------Below is Formatting methods to add spaces and take out blank array spots------
function removeEmpty(instruction){
    let count =0;
    let newInstruction = new Array();

    for(let i=0; i < instruction.length;i++){
        if(instruction[i] != ""){
            newInstruction[count] = instruction[i];
            count++;
        }
    }
    return newInstruction;
}
/**
 * Logic to remove comments in the array with all the code 
 * @param {} lines 
 */
function removeComments(lines){
    
    for(let line =0; line< lines.length; line++){
        
        lines[line] = lines[line].replace(new RegExp(",",'g') , " , ");
		lines[line] = lines[line].replace("]" , " ] ");
		lines[line] = lines[line].replace("[" , " [ ");
		lines[line] = lines[line].replace("}" , " } ");
		lines[line] = lines[line].replace("{" , " { ");
		lines[line] = lines[line].replace("+" , " + ");
        lines[line] = lines[line].replace("-" , " - ");
        let curString = lines[line];
        if (curString.startsWith(";")){
            lines[line] = "";
        }else if(curString.includes(";")){
            lines[line] = lines[line].substring(0,lines[line].indexOf(";"));
        }
        //console.log(lines[line]);
    }
    withComments =lines;
}

//----------------------Below is the main methods running everything--------------------
/**
 * Main method - Formats output of the assembly and runs the code through methods
 */
function mainMethod(){
    let fileDisplayArea = document.getElementById('fileDisplayArea');
    fileDisplayArea.innerText = "";
    let count = 0;
    //Remove white spaces
    for(let i=0; i < withComments.length;i++){
        if(withComments[i] != ""){
            withoutComments[count] = withComments[i];
            count++;
        }
    }
    //console.log(withoutComments);
    
    //Run commands to assemble code
    withoutComments = getJumps(withoutComments);
    findDataStart(withoutComments);
    parseCodeSegment(withoutComments);
    console.log(withoutComments);
    console.log(lineNumber);
    console.log(machineCode);


    fileDisplayArea.innerHTML += "<b>Assembly Code:</b>\n";
    
    for(let line =0; line <withoutComments.length; line++){
        let eachLine = withoutComments[line].split(" ");
        eachLine =removeEmpty(eachLine);

        //Format the array to have 3 parts
        if(eachLine.length > 2){
            if(eachLine[1].localeCompare("[") ==1){
                for(let i =3; i< eachLine.length; i++){
                    if(eachLine[2].localeCompare(",") == 0){
                        eachLine[2] = "";
                    }
                    eachLine[2] += eachLine[i];
                    eachLine[i] = "";
                }
            }else{
                for(let i = 2; i < eachLine.length; i++){
                    if(eachLine[i].localeCompare("]") == 0){
                        eachLine[1] += "]";
                        eachLine[i] = "";
                        eachLine[i+1] ="";
                        break;
                    }else{
                        eachLine[1] += eachLine[i];
                        eachLine[i] = "";
                    }
                }
                
            }
        }

        //Place into the table
        eachLine =removeEmpty(eachLine);
        let x = document.getElementById('assemblyTable').insertRow(line);
        
        //Add line numbers
        if(eachLine.length == 3){
            eachLine[3] = eachLine[2];
            eachLine[2] = eachLine[1];
            eachLine[1] = eachLine[0];
            eachLine[0] = line;
        }else if (eachLine.length == 2){
            eachLine[3] = "";
            eachLine[2] = eachLine[1];
            eachLine[1] = eachLine[0];
            eachLine[0] = line;
        }else{
            eachLine[3] = "";
            eachLine[2] = "";
            eachLine[1] = eachLine[0];
            eachLine[0] = line;
        }
        
        for(let parts =0; parts < eachLine.length; parts++){
            
            let y = x.insertCell(parts);
            
            y.innerHTML = eachLine[parts];
        } 
    }
    document.getElementById("displayMachinetext").innerHTML +=  "<b>Machine Code:</b><br>";
    let formatMachine = machineCode.split("/n");
    for(let print =0; print < formatMachine.length; print++ ){
        document.getElementById("displayMachine").innerText +=   formatMachine[print];
        document.getElementById("displayMachine").innerHTML += "<br>";
        
    }
   
    
    
}
function formatInput(){
    let inputP = document.getElementById("textInput");
    let lines =  inputP.innerText.split("\n");
    let count =0;
    removeComments(lines);
    inputP.innerText ="";
    //remove white spaces
    for(let i=0; i < withComments.length;i++){
        if(withComments[i] != ""){
            withoutComments[count] = withComments[i];
            count++;
        }
    }
    for(let line =0; line < withoutComments.length; line++){
        inputP.innerText += withoutComments[line] + "\n";
    }

}
//------------------------------Below is all of the parses for each instrcution---------------

/**
 * NOOP instruction in machine code
 */
function parseNOOP(){
    machineCode += "00_00_00000000";
	machineCode += "\n";
}
/**
 * ADDI instruction in machine code
 */
function parseADDI(code){
    machineCode += getRegisterName(code[1]);
    getComma(code[2]);
    machineCode += "00_";
    let immediateValue = code[3];
    checkImmediateValueOutOfBounds(immediateValue);
    machineCode += convertStringToBinary(immediateValue);
    machineCode += "\n";
}
/**
 * LOADI instruction and machine code
 */
function parseLOADI(code){
    let reg = code[1];
    machineCode += getRegisterName(reg);
    getComma(code[2]);
    machineCode += "00_";
    machineCode += convertStringToBinary(code[3]);
    machineCode += "\n";
}

/**
 * LOAD instruction to machine code
 */
function parseLOAD(code){
    machineCode += getRegisterName(code[1]);
    machineCode += "00_";
    getComma(code[2]);
    getLeftBracket(code[3]);
    let dataValue = code[4];
    let next = code[5];

    if(next.localeCompare("+") == 0){
        let offset = parseInt(code[6]);
        let newOffset = valueMapping.get(dataValue) + offset;
        checkAddressOutOfBounds(newOffset);
        machineCode += convertStringToBinary(newOffset);
        getRightBracket(code[7]);
    }
    else if(next.localeCompare("-") == 0){
        let offset = parseInt(code[6]);
        let newOffset = valueMapping.get(dataValue) - offset;
        checkAddressOutOfBounds(newOffset);
        machineCode += convertStringToBinary(newOffset);
        getRightBracket(code[7]);
    }
    else if(next.localeCompare("]") ==0){
        machineCode += convertStringToBinary(valueMapping.get(dataValue));
    }
    else{
        errorMessage("Expecting +, - or ]");
    }
    machineCode += "\n";


}
/**
 * LOADF instruction to machine code
 */
function parseLOADF(code){
    machineCode += getRegisterName(code[1]);
    getComma(code[2]);
    getLeftBracket(code[3]);
    let dataValue = code[4];
    getPlus(code[5]);
    machineCode += getRegisterName(code[6]);

    if(code[7].localeCompare("+") == 0){
        let offset = code[8];
        let newOffset = valueMapping.get(dataValue) + offset;
        warnAddressOutOfBounds(newOffset);
        machineCode += convertStringToBinary(newOffset);
        getRightBracket(code[9]);
    }
    else if(code[7].localeCompare("-") == 0){
        let offset = code[8];
        let newOffset = valueMapping.get(dataValue) - offset;
        warnAddressOutOfBounds(newOffset);
        machineCode += convertStringToBinary(newOffset);
        getRightBracket(code[9]);
    }
    else if(code[7].localeCompare("]") == 0){
        machineCode += convertStringToBinary(valueMapping.get(dataValue));
    }
    else{
        errorMessage("Expecting +,-, or ]");
    }
    machineCode += "\n";
}
/**
 * STOREF instruction to machine code
 */
function parseSTOREF(code){
    let temp = "";
    getLeftBracket(code[1]);
    let dataValue = code[2];
    getPlus(code[3]);
    temp += getRegisterName(code[4]);
    let next = code[5];
    if(next.localeCompare("+") == 0){
        let offset = parseInt(code[6]);
        let newOffset = valueMapping.get(dataValue) + offset;
        warnAddressOutOfBounds(newOffset);
        temp += convertStringToBinary(newOffset);
        getRightBracket(code[7]);
    }
    else if(next.localeCompare("-") ==0){
        let offset = parseInt(code[6]);
        let newOffset = valueMapping.get(dataValue) - offset;
        warnAddressOutOfBounds(newOffset);
        temp += convertStringToBinary(newOffset);
        getRightBracket(code[7]);
    }
    else if(next.localeCompare("]") ==0){
        temp += convertStringToBinary(valueMapping.get(dataValue));
    }else{
        errorMessage("Expecting +,- or ]");
    }
    getComma(code[6]);
    machineCode += getRegisterName(code[7]);
    machineCode += temp;
    machineCode += "\n";
}

/**
 * CMP instruction to machine code
 */
function parseCMP(code){

    machineCode += getRegisterName(code[1]);
    getComma(code[2]);
    machineCode += getRegisterName(code[3]);
    machineCode += "00000000";
    machineCode += "\n";

}
/**
 * BRGE instruction to machine code
 */
function parseBRGE(code, line){
    machineCode += "00_11_";
    machineCode += branchDifference(line, code[1]);
    machineCode += "\n";
}
/**
 * Jump instruction to machine code
 */
function parseJUMP(code, line){
    machineCode += "00_00_";
    machineCode += branchDifference(line, code[1]);
    machineCode += "\n";
}

//------------------------------------Helper methods for the instructions-----------------
/**
 * Maps a string to binary by looping through value
 */
function mapIntoBinary(string){
    let toReturn = string;
    while(toReturn.length < 8){
        toReturn = 0 + toReturn;
    }
    return toReturn;
}
/**
 * converts a string to binary used for immediate values
 */
function convertStringToBinary(input){
    input = parseInt(input);
    if(isNaN(input)){
        errorMessage("Expecting immediate value (Integer) ");
    }else{
        let eightBit = mapIntoBinary(input.toString(2));
        if(eightBit.length > 8){  //Case of negative
            return eightBit.substring(eightBit.length-8, eightBit.length);
        }
        return eightBit;
    }

}

function branchDifference(line, destination){
    let diff = branchDest.get(destination) - line;
    return convertStringToBinary(diff);
}
/**
 * Function makes sure the address is within the given 0 -64
 */
function checkAddressOutOfBounds(address){
    if(address < 0 || address >63){
        error("Adress out of bounds, attempting to access address " + address);
    }
}
function warnAddressOutOfBounds(address){
    if(address < 0 || address > 63){
       alert( "Warning: Address may be out of bounds depending on the value of the register.\n"
                + "         Assuming it is 0, then attempting to access address " + address +".");
    }
}
function checkImmediateValueOutOfBounds(immediateValue){
    if(immediateValue.includes("-")){
        errorMessage("Expecting positive immediate value. Negative number given");
    }
    if(immediateValue < -128 || immediateValue > 127){
        errorMessage("Immediate value " + immediateValue + " out of bounds");
    }
}
/**
 * Checking for comma
 */
function getComma(comma){
    if(comma.localeCompare(",") == 1){
        errorMessage("Expecting comma");
    }
}
/**
 * Checking for a left bracket
 */
function getLeftBracket(leftBracket){
    if(leftBracket.localeCompare("[") == 1){
        errorMessage("Expected left bracket");
    }
}
/**
 * Checking for a Right bracket
 */
function getRightBracket(rightBracket){
    if(rightBracket.localeCompare("]") == 1){
        errorMessage("Expected left bracket");
    }
}
/**
 * Checking for the plus symbol
 */
function getPlus(plus){
    if(plus.localeCompare("+") == 1){
        error("Expected Right bracket");
    }
}
/**
 * Get the machine code for each register
 * Allowed registers A, B, C, D 
 */
function getRegisterName(register){
    if(register.localeCompare("A") == 0){
        return "00_";
    }
    else if(register.localeCompare("B") == 0){
        return "01_";
    }
    else if(register.localeCompare("C") == 0){
        return "10_";
    }
    else if(register.localeCompare("D") == 0){
        return "11_";
    }
    else{
        errorMessage("Expecting register name (A,B,C,D)");
        return "0";
    }
}
/**
 * Adds the opcode bits to the corresponding instruction to the final output of macheine code
 */
function getOpCodeBits(instruction){
    for(let i=0; i< instructionSet.length; i++){
        if(instruction.localeCompare(instructionSet[i]) ==0){
            machineCode += instructionFormat[i];
            return;
        }
    }
    errorMessage("Expecting Opcode");
}

/**
 * Takes in the error as input and outputs to the user what line the error is occuring on 
 */
function errorMessage(error){
    alert(error + " on line " + lineNumber);
}


//---------------------------Display options for the html page--------------------------
/**
 * Choice to show the file open options
 */
function ShowFile(){
    let T = document.getElementById("fileDiv");
    let F = document.getElementById("inputDiv");
    T.style.display ="block";
    F.style.display ="none";
}
/**
 * Choice to show the input box
 */
function ShowTextbox(){
    let F = document.getElementById("inputDiv");
    let T = document.getElementById("fileDiv");
    F.style.display ="block";
    T.style.display = "none";
}
/**
 * Used by the input box to see a preview of what you will compile
 */
function fillP(){
    let input = document.getElementById("textArea");
    let paragraph = document.getElementById("textInput");
    paragraph.innerText = input.value;

}
//TODO - Parse only the data
function getData(){ 
}
