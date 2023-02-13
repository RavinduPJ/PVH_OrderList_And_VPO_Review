import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Component } from "@angular/core";
import { ViewChild, ElementRef } from "@angular/core";
import * as XLSX from "xlsx";
import { OBKEYS, OORKEYS, OTRKEYS, SAKEYS, OLRKEYS, } from "../../../constants/columnKeys";
import { DbconService } from "../../services/dbcon.service";
import { ComparisonModelComponent } from "./comparison-model/comparison-model.component";
import { ComparisonModalOtrComponent } from "./comparison-modal-otr/comparison-modal-otr.component";
import { ComparisonModalShipmentComponent } from "./comparison-modal-shipment/comparison-modal-shipment.component";
import { ComparisonModalOlrComponent } from "./comparison-modal-olr/comparison-modal-olr.component";
import { NbToastrService } from '@nebular/theme';
import { DatePipe } from '@angular/common'
@Component({
  selector: "ngx-ecommerce",
  templateUrl: "./bff.component.html",
  styleUrls: ["./bff.component.scss"],
})
export class bffComponent {
  constructor(private DbconService: DbconService, public modalService: NgbModal, private toastr: NbToastrService, public datepipe: DatePipe) {
  }

  @ViewChild(ComparisonModelComponent) OORComparisionModel: ComparisonModelComponent;
  @ViewChild(ComparisonModalOtrComponent) OTRComparisionModel: ComparisonModalOtrComponent;
  @ViewChild(ComparisonModalShipmentComponent) SAComparisionModel: ComparisonModalShipmentComponent;
  @ViewChild(ComparisonModalOlrComponent) OLRComparisionModel: ComparisonModalOlrComponent;
  @ViewChild("fileDropRef", { static: false }) fileDropEl: ElementRef;

  isOBProcessing: boolean;
  isOORProcessing: boolean;
  isOTRProcessing: boolean;
  isOLRProcessing: boolean;
  isSAProcessing: boolean;

  OBFileObject = null;
  OORFileObject = null;
  OTRFileObject = null;
  OLRFileObject = null;
  SAFileObject = null;

  onFileChange(fileType, files) {
    switch (fileType) {
      case "OBFile":
        this.OBFileObject = files[0];
        break;
      case "OORFile":
        this.OORFileObject = files[0];
        break;
      case "OTRFile":
        this.OTRFileObject = files[0];
        break;
      case "SAFile":
        this.SAFileObject = files[0];
        break;
      case "OLRFile":
        this.OLRFileObject = files[0];
        break;
      default:
        alert("invalid file type");
    }
  }

  // on upload OB File (Master data)
  async onUploadOBFile() {
    this.isOBProcessing = true;
    
    //Validate file availbity 
    if(this.OBFileObject == null){
      this.toastr.warning("", "OB file is missing!"); 
    }

    //  STEP1 - Read file
    const OBFileJson = await this.readExcelFile(this.OBFileObject, OBKEYS);
    const finalOBFileData = []

    //  STEP2 - Manupilate unique keys
    for (const row of OBFileJson) {
      // const OBUniqueKey =
      //   this.formatCharAt(row["styleNo"], 2) +
      //   this.formatSubString(row["custStyleNo"], 6) +
      //   this.formatToString(row["season"]) +
      //   this.formatToString(row["VPONo"]) +
      //   this.formatSubString(row["colorName"], 4) +
      //   this.formatToString(row["COQty"]);
      const OBUniqueKey =
        this.formatToString(row["season"]) + "-" +
        this.formatSubString(row["colorName"], 4) + "-" +
        this.formatSubString(row["custStyleNo"], 6) + "-" +
        this.formatToString(row["VPONo"]) + "-" +
        this.formatToString(row["COQty"]);

      const OORUniqueKey =
        this.formatToString(row["season"]) +
        this.formatSubString(row["colorName"], 4) +
        this.formatSubString(row["custStyleNo"], 6) +
        this.formatToString(row["VPONo"]) +
        this.formatToString(row["COQty"])

      const OORUniqueKeyD =
        this.formatToString(row["season"]) + "-"+
        this.formatSubString(row["colorName"], 4) + "-"+
        this.formatSubString(row["custStyleNo"], 6) + "-"+
        this.formatToString(row["VPONo"]) + "-"+
        this.formatToString(row["COQty"]);
      
      const OTRUniqueKey =
        this.formatToString(row["season"]) +
        this.formatSubString(row["custStyleNo"], 6) +
        this.formatToString(row["VPONo"]) +
        this.formatSubString(row["colorName"], 4) +
        this.formatToString(row["COQty"]);

      const SAUniqueKey =
        this.formatSubString(row["custStyleNo"], 6) +
        this.formatSubString(row["colorName"], 4) +
        this.formatToString(row["VPONo"]) +
        this.formatToString(row["COQty"]);

      const OLRUniqueKey =
        this.formatToString(row["VPONo"]) +
        this.formatSubString(row["custStyleNo"], 6) +
        this.formatSubString(row["colorName"], 4)+
        this.getOLRStyleNO(this.formatCharAt(row["styleNo"], 1)) +
        this.formatToString(row["COQty"])+
        this.formatToString(row["season"]);
        
        console.log(OBUniqueKey);
        
      row["OBKey"] = OBUniqueKey;
      row["OORKey"] = OORUniqueKey;
      row["OTRKey"] = OTRUniqueKey;
      row["SAKey"] = SAUniqueKey;
      row["OLRKey"] = OLRUniqueKey;


      finalOBFileData.push(row);
    }

    //  STEP3 - Delete existing table in indexedDB & insert data to IndexedDB
    const dbInserResponse = await this.DbconService.addBulk("bffOrderBook", finalOBFileData);
    
    //STEP4 - Success toast
    this.toastr.success("", "OB file successfully uploaded!"); 
    
    //  END OF METHOD
    this.isOBProcessing = false;
  }

  // on Compare OOR
  async onCompareOOR() {
    this.isOORProcessing = true;

    //Validate file availbity 
    if(this.OORFileObject == null){
      this.toastr.warning("", "OOR file is missing!"); 
    }

    //  STEP1 - Read file
    const OORFileJson = await this.readExcelFile(this.OORFileObject, OORKEYS);
    const formattedOORFileData = [];

    //  STEP2 - Manupilate unique key
    for (const row of OORFileJson) {
      const ORRUniqueKey =
        row["POSeasonCode"] +
        row["choiceCode"] +
        this.formatSubStringRyt(row["articlePLMID"], 6)+
        row["PO"] +
        row["orderQuantity"];

      const ORRUniqueKeyUI =
        row["POSeasonCode"] + "-" +
        row["choiceCode"] + "-" +
        this.formatSubStringRyt(row["articlePLMID"], 6)+ "-" +
        row["PO"] + "-" +
        row["orderQuantity"];

      row["OORKey"] = ORRUniqueKey;
      row["OORKeyUI"] = ORRUniqueKeyUI;

      formattedOORFileData.push(row);
    }

    // NOTE: NO need to insert to db as data is processiong on clientSide
    // STEP - Delete existing table in indexedDB & insert data to IndexedDB

    //Need to insert data in the client side to the download funtion
    const dbInserResponse = await this.DbconService.addBulk("bffOOR", formattedOORFileData);

    // STEP3 - process OOR data and find matching OB data row on indexedDB
    const OORMatchedOBRows = [];
    const test = [];

    for (const row of formattedOORFileData) {
      const OBMatchedRow = await this.DbconService.getByIndex(
        "bffOrderBook",
        "OORKey",
        row.OORKey
      );

      console.log(OBMatchedRow);

      // STEP3.1 - manupilate JSON objet for compare model
      let compositeKey, prodWarehouse, shipmentMode, reqDeldate, planDelDate, COQty;
      if (OBMatchedRow) {
        compositeKey = row.OORKeyUI,
        prodWarehouse = OBMatchedRow.prodWarehouse,
        shipmentMode = OBMatchedRow.shipmentMode,
        reqDeldate = OBMatchedRow.reqDeldate,
        planDelDate = OBMatchedRow.planDelDate,
        COQty = OBMatchedRow.COQty
      }else{
        compositeKey = row.OORKeyUI,
        prodWarehouse = "",
        shipmentMode = "",
        reqDeldate = "",
        planDelDate = "",
        COQty = ""
      }
      OORMatchedOBRows.push({
        compositeKey: compositeKey,
        // OB FILE Fields
        prodWarehouse: prodWarehouse,
        shipmentMode: this.mapOBShipmentModeAndOORMoS(shipmentMode),
        reqDeldate: this.formatOBDateForOOROTROLR(reqDeldate),
        planDelDate: this.formatOBDateForOOROTROLR(planDelDate),
        COQty: COQty,
        // OOR FILE Fields
        factoryVendor: this.mapProdWHAndFV(row.factoryVendor),
        modeOfShip: row.modeOfShip,
        originalMastOwnershipDate: this.formatExcelDateToDateObj(row.originalMastOwnershipDate),
        planMASTOwnershipDate: this.formatExcelDateToDateObj(row.planMASTOwnershipDate),
        orderQuantity: row.orderQuantity,
      });
    }

    //STEP4 - success message toast
    this.toastr.success("", "OOR file successfully uploaded!"); 

    // STEP5 - Trigger data comparison model
    this.OORComparisionModel.openModel(OORMatchedOBRows);

    //  END OF METHOD
    this.isOORProcessing = false; // REVISIT
  }

  async onCompareOTR() {
    this.isOTRProcessing = true;

    //Validate file availbity 
    if(this.OTRFileObject == null){
      this.toastr.warning("", "OTR file is missing!"); 
    }

    //  STEP1 - Read file
    const OTRFileJson = await this.readExcelFile(this.OTRFileObject, OTRKEYS);
    const formattedOTRFileData = [];

    //  STEP2 - Manupilate unique key
    for (const row of OTRFileJson) {
      var flexProTo = null;
      if (row["flexProto"]) {
        flexProTo = this.formatSubStringRyt(row["flexProto"], 6);
      }
      const OTRUniqueKey =
        row["season"] +
        flexProTo +
        row["SOCPO"] +
        row["flexColorCode"] +
        row["qty"];

      const OTRUniqueKeyUI =
        row["season"] + "-" +
        flexProTo + "-" +
        row["SOCPO"] + "-" +
        row["flexColorCode"] + "-" +
        row["qty"];

      row["OTRKey"] = OTRUniqueKey;
      row["OTRKeyUI"] = OTRUniqueKeyUI;

      formattedOTRFileData.push(row);
    }

    // NOTE: NO need to insert to db as data is processiong on clientSide
    //  STEP - Delete existing table in indexedDB & insert data to IndexedDB

    
    //Need to insert data in the client side to the download funtion
    const dbInserResponse = await this.DbconService.addBulk("bffOTR", formattedOTRFileData);

    // STEP3 - process OTR data and find matching OB data row on indexedDB
    const OTRMatchedOBRows = [];
    for (const row of formattedOTRFileData) {
      const OBMatchedRow = await this.DbconService.getByIndex(
        "bffOrderBook",
        "OTRKey",
        row.OTRKey
      );
      // STEP3.1 - manupilate JSON objet for compare model
      let compositeKey, prodWarehouse, destination, shipmentMode, reqDeldate, planDelDate, COQty;
      if (OBMatchedRow) {
        compositeKey = row.OTRKeyUI,
        prodWarehouse = OBMatchedRow.prodWarehouse,
        destination = OBMatchedRow.destination,
        shipmentMode = OBMatchedRow.shipmentMode,
        reqDeldate = OBMatchedRow.reqDeldate,
        planDelDate = OBMatchedRow.planDelDate
        COQty = OBMatchedRow.COQty
      }else{
        compositeKey = row.OTRKeyUI,
        destination = "",
        prodWarehouse = "",
        shipmentMode = "",
        reqDeldate = "",
        planDelDate = "",
        COQty = ""
      } 
      OTRMatchedOBRows.push({
        compositeKey: compositeKey,
        // OB FILE Fields
        prodWarehouse: prodWarehouse,
        shipmentMode: this.mapOBShipmentModeAndOTRCSM(shipmentMode),
        destination: destination,
        reqDeldate: this.formatOBDateForOOROTROLR(reqDeldate),
        planDelDate: this.formatOBDateForOOROTROLR(planDelDate),
        COQty: COQty,
        // OTR FILE Fields
        originalFtySAP: this.mapOFtySAPAndProdWH(row.originalFtySAP),
        confirmedShipMode: row.confirmedShipMode,
        customerCode: this.mapOTRDestinationAndOBCustomerCode(row.customerCode),
        OMODOriginalGAC: this.formatExcelDateToDateObj(row.OMODOriginalGAC),
        currentSystemMODGAC: this.formatExcelDateToDateObj(row.currentSystemMODGAC),
        qty: row.qty,
      });
    }

    //STEP4 - success message toast
    this.toastr.success("", "OTR file successfully uploaded!"); 

    // STEP5 - Trigger data comparison model
    this.OTRComparisionModel.openModel(OTRMatchedOBRows);

    //  END OF METHOD
    this.isOTRProcessing = false; // REVISIT
  }

  // on Compare SA
  async onCompareSA() {
    this.isSAProcessing = true;

    //Validate file availbity 
    if(this.SAFileObject == null){
      this.toastr.warning("", "SA file is missing!"); 
    }

    //  STEP1 - Read file
    const SAFileJson = await this.readExcelFile(this.SAFileObject, SAKEYS);
    const formattedSAFileData = [];

    //  STEP2 - Manupilate unique key
    for (const row of SAFileJson) {
      const SAUniqueKey =
        this.formatSubString(row["itemDescription"], 6) +
        this.formatSubString(row["color"], 4) +
        row["CpoNo"] +
        row["originalQty"];

      const SAUniqueKeyUI =
        this.formatSubString(row["itemDescription"], 6) + "-" +
        this.formatSubString(row["color"], 4) + "-" +
        row["CpoNo"] + "-" +
        row["originalQty"];

      row["SAKey"] = SAUniqueKey;
      row["SAKeyUI"] = SAUniqueKeyUI;

      formattedSAFileData.push(row);
    }
    // NOTE: NO need to insert to db as data is processiong on clientSide
    //  STEP - Delete existing table in indexedDB & insert data to IndexedDB
    
    //Need to insert data in the client side to the download funtion
    const dbInserResponse = await this.DbconService.addBulk("bffSA", formattedSAFileData);

    // STEP3 - process SA data and find matching OB data row on indexedDB
    const SAMatchedOBRows = [];
    for (const row of formattedSAFileData) {
      const OBMatchedRow = await this.DbconService.getByIndex(
        "bffOrderBook",
        "SAKey",
        row.SAKey
      );
      // STEP3.1 - manupilate JSON objet for compare model
      let compositeKey, prodWarehouse, destination, shipmentMode, reqDeldate, planDelDate, COQty, FOBPrice ;
      if (OBMatchedRow) {
        compositeKey =  row.SAKeyUI,
        prodWarehouse = OBMatchedRow.prodWarehouse,
        destination = OBMatchedRow.destination,
        shipmentMode = OBMatchedRow.shipmentMode,
        reqDeldate = OBMatchedRow.reqDeldate,
        planDelDate = OBMatchedRow.planDelDate
        COQty = OBMatchedRow.COQty
        FOBPrice = OBMatchedRow.FOBPrice
      }else{
        compositeKey = row.SAKeyUI,
        destination = "",
        prodWarehouse = "",
        shipmentMode = "",
        reqDeldate = "",
        planDelDate = "",
        COQty = "",
        FOBPrice = ""
      } 
      SAMatchedOBRows.push({
        // TODO - logic should apply here
        compositeKey: compositeKey,
        // OB FILE Fields
        prodWarehouse: prodWarehouse,
        shipmentMode: this.mapOBShipmentModeAndSAMode(shipmentMode),
        destination: destination,
        reqDeldate: this.formatDatesOB(reqDeldate),
        planDelDate: this.formatDatesOB(planDelDate),
        COQty: COQty,
        FOBPrice: FOBPrice,
        // SA FILE Fields
        productionFactory: this.mapSAProductionFactoryAndOBProdWH(row.productionFactory),
        mode: row.mode,
        SAdestination: this.mapSADestinationAndOBDestination(row.destination),
        handOverDate: this.formatExcelDateToDateObj(row.handOverDate),
        originalQty: row.originalQty,
        BAFob: row.BAFob,
      });
    }

    //STEP4 - success message toast
    this.toastr.success("", "SA file successfully uploaded!"); 
    
    // STEP5 - Trigger data comparison model
    this.SAComparisionModel.openModel(SAMatchedOBRows);

    //  END OF METHOD
    this.isSAProcessing = false; // REVISIT
  }

  async onCompareOLR() {
    this.isOLRProcessing = true;

    //Validate file availbity 
    if(this.OLRFileObject == null){
      this.toastr.warning("", "OLR file is missing!"); 
    }

    //  STEP1 - Read file
    const OLRFileJson = await this.readExcelFile(this.OLRFileObject, OLRKEYS);
    const formattedOLRFileData = [];

    // STEP2 - Create tempory key 
    for (const row of OLRFileJson){
      const OLRTempKey = row["VPONO"] +
        this.formatSubStringRyt(row["TECHPACKNO"], 6) +
          this.formatSubStringRyt(row["MASTCOLORCODE"], 4);
      
      row["OLRTempKey"] = OLRTempKey;     
      formattedOLRFileData.push(row);
    } 

    //STEP3 - Create unique key
    let groupedOLRFileData = this.groupArray(formattedOLRFileData, 'OLRTempKey')
    for (const tempKey in groupedOLRFileData) {
      let ORDERQtySum = 0
      // calculate ORDERQTY sum
      for (const row of groupedOLRFileData[tempKey]) {
        ORDERQtySum += row.ORDERQTY
      }
      // push rows with OLR Key
      for (const row of groupedOLRFileData[tempKey]) {
        const OLRKey =
          this.formatToString(row["VPONO"]) +
          this.formatSubStringRyt(row["TECHPACKNO"], 6) +
          this.formatSubStringRyt(row["MASTCOLORCODE"], 4) +
          this.getOLR_CUSTSIZEDESC(this.formatToString(row["CUSTSIZEDESC"]))+
          ORDERQtySum +
          this.formatToString(row["SEASON"]);

        const OLRKeyUI =
          this.formatToString(row["VPONO"]) + "-" +
          this.formatSubStringRyt(row["TECHPACKNO"], 6) + "-" +
          this.formatSubStringRyt(row["MASTCOLORCODE"], 4) + "-" +
          this.getOLR_CUSTSIZEDESC(this.formatToString(row["CUSTSIZEDESC"]))+ "-" +
          ORDERQtySum + "-" +
          this.formatToString(row["SEASON"]);

        row['OLRKey'] = OLRKey  
        row['OLRKeyUI'] = OLRKeyUI  
        
        row['OLRORDERQtySum'] = ORDERQtySum
        formattedOLRFileData.push(row)
      }
    }

    // NOTE: NO need to insert to db as data is processiong on clientSide

    
    //Need to insert data in the client side to the download funtion
    const dbInserResponse = await this.DbconService.addBulk("bffOLR", formattedOLRFileData);

    // STEP4 - process SA data and find matching OB data row on indexedDB
    const OLRMatchedOBRows = [];

    for (const row of formattedOLRFileData) {
      const OBMatchedRow = await this.DbconService.getByIndex(
        "bffOrderBook",
        "OLRKey",
        row.OLRKey
      );
      // STEP4.1 - manupilate JSON objet for compare model
      let compositeKey, prodWarehouse, destination, shipmentMode, reqDeldate, planDelDate, COQty, FOBPrice ;
      if (OBMatchedRow) {
        compositeKey = row.OLRKeyUI,
        prodWarehouse = OBMatchedRow.prodWarehouse,
        destination = OBMatchedRow.destination,
        shipmentMode = OBMatchedRow.shipmentMode,
        reqDeldate = OBMatchedRow.reqDeldate,
        planDelDate = OBMatchedRow.planDelDate
        COQty = OBMatchedRow.COQty
        FOBPrice = OBMatchedRow.FOBPrice
      }else{
        compositeKey = row.OLRKeyUI,
        destination = "",
        prodWarehouse = "",
        shipmentMode = "",
        reqDeldate = "",
        planDelDate = "",
        COQty = "",
        FOBPrice = ""
      } 
      OLRMatchedOBRows.push({
        compositeKey: compositeKey,
        // OB FILE Fields
        prodWarehouse: prodWarehouse,
        shipmentMode: this.mapShipModeAndShipmentMode(shipmentMode),
        destination: destination,
        reqDeldate: this.formatOBDateForOOROTROLR(reqDeldate),
        planDelDate: this.formatOBDateForOOROTROLR(planDelDate), 
        COQty: COQty,
        FOBPrice: FOBPrice,
        // OLR FILE Fields
        productionFactory: this.mapFactoryIDAndProdWH(row.FACTORYID),
        mode: row.SHIPMODE,
        SAdestination: this.mapOLRCustCodeAndOBDestination(row.CUSTCODE),
        orginalMode: this.formatExcelDateToDateObj(row.ORIGINALMOD),
        handOverDate: this.formatExcelDateToDateObj(row.SHIPDATE),
        originalQty: row.OLRORDERQtySum,
        BAFob: row.MIDDLEMANCHARGES+row.FACTORYCOST,
      });
    }

    //STEP5 - Success message toast
    this.toastr.success("", "OLR file successfully uploaded!"); 

    //STEP6 - Filter data from unique composite key
    const key = 'compositeKey'
    const OLRUniqueRow = [...new Map(OLRMatchedOBRows.map(item =>[item[key], item])).values()]
    
    // STEP7 - Trigger data comparison model
    this.OLRComparisionModel.openModel(OLRUniqueRow);

    //  END OF METHOD
    this.isOLRProcessing = false; // REVISIT
  }

  // GET OLR Style Number
  getOLRStyleNO(styleShortCode) {
    switch (styleShortCode) {
      case "S":
        return "Short";
      case "L":
        return "Long";
      default:
        return "Reg";
    }
  }

  //Get OLR custsizedesc code 
  getOLR_CUSTSIZEDESC(custSize){
    if(custSize.includes('SHORT') || custSize.includes('.S')){
      return "Short";
    }else if(custSize.includes('Long') || custSize.includes('.L')){
      return "Long";
    }else{
      return "Reg"
    }
  } 

  // Util functions
  readExcelFile(file, headers): Promise<any> {
    return new Promise<any>((resolve) => {
      let workBook = null;
      let sheetToJsonData = null;
      const reader = new FileReader();

      reader.onload = () => {
        const data = reader.result;
        workBook = XLSX.read(data, { type: "binary", cellDates: false });
        sheetToJsonData = workBook.SheetNames.reduce((initial, name) => {
          const sheet = workBook.Sheets[name];
          initial.sheet = XLSX.utils.sheet_to_json(sheet, {
            header: headers,
            range: 1,
          });
          return initial;
        }, {});
        resolve(sheetToJsonData.sheet);
      };
      reader.readAsBinaryString(file);
    });
  }

  groupArray(list, key) {
    return list.reduce((a, item) => {
      (a[item[key]] = a[item[key]] || []).push(item);
      return a;
    }, {});
  }

  formatBytes(bytes, decimals = 2) { 
    if (bytes === 0) {
      return "0 Bytes";
    }
    const k = 1024;
    const dm = decimals <= 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  formatToString(val){
    if((val == null)){
      val = "";
      return val
    }else{
      val = val.toString()
      return val
    }
  }

  formatCharAt(val, position){
    if((val == null)){
      val = "";
      return val
    }else{
      val = val.toString().charAt(position)
      return val
    }
  }

  formatSubString(val, position){
    if((val == null)){
      val = "";
      return val
    }else{
      val = val.toString().substring(0, position)
      return val
    }
  }

  formatSubStringRyt(val, position){
    if((val == null)){
      val = "";
      return val;
    }else{
      val = val.toString().substr(val.toString().length - position)
      return val;
    }
  }

  formatDatesOB(date){
    var day = this.formatSubStringRyt(date, 2) ;
    var month = `${this.formatCharAt(date,4)}${this.formatCharAt(date,5)}`;
    var year = this.formatSubString(date,4);

    const convertedDate =  year + '-' + month + '-' + day ;

    return convertedDate;
  }

  formatExcelDateToDateObj(serial){ 
    if (!!serial){
      const utc_days  = Math.floor(serial - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      const fractional_day = serial - Math.floor(serial) + 0.0000001;
      let total_seconds = Math.floor(86400 * fractional_day);
      const seconds = total_seconds % 60;
      total_seconds -= seconds;
      const hours = Math.floor(total_seconds / (60 * 60));
      const minutes = Math.floor(total_seconds / 60) % 60;

      let convertedDate = new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
      let cd = this.formatDate(convertedDate);
      return cd;
    } else {
      return null;
    }
  }

  formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;
    return [year, month, day].join('-');
  }

  formatOBDateForOOROTROLR(date){
    if(date){
      var day = this.formatSubStringRyt(date, 2) ;
      var month = `${this.formatCharAt(date,4)}${this.formatCharAt(date,5)}`;
      var year = this.formatSubString(date,4);
  
      const convertedDate =  year + '-' + month + '-' + day ;
      var d = new Date(convertedDate);
  
      // add a day
      d.setDate(d.getDate() + 1);
      const  cd = this.formatDate(d)
  
      return cd;
    }else{
      return null
    }
  }

  //OB and OOR Mapping
  //Prod Warehouse and Factory vendor
  mapProdWHAndFV(value){
    switch (value) {
      case "36013821":
        return "N09";
      case "36013778":
        return "N03";
      case "36013805":
        return "N01";
      case "36014510":
        return "N32";
      case "36013804":
        return "N02";
      case "36014086":
        return "N32";
      case "36013816":
        return "N31";
      case "36014610":
        return "N35";
      case "36013811":
        return "N23";
      default:
        return value;
    }
  }

  //OB - Shipment Mode and OOR - Mode Of Ship
  mapOBShipmentModeAndOORMoS(value){
    switch (value) {
      case "SEA":
        return "OCEAN";
      case "ARC":
        return "AIR";
      case "ARP":
        return "FACTORY AIR";
      case "CRP":
        return "AIR";
      case "ASP":
        return "AIR";
      case "AIR":
        return "AIR";
      case "SAB":
        return "AIR";
      case "CRC":
        return "AIR";
      case "SAV":
        return "AIR";
      case "SAC":
        return "OCEAN";
      case "SEP":
        return "OCEAN";
      default:
        return value;
    }
  }

  //OB and OTR Mapping
  //OTR-OFtySAP# and OB-InternalPlantCode 
  mapOFtySAPAndProdWH(value){
    switch (value) {
      case "36013821":
        return "N09";
      case "36013778":
        return "N03";
      case "36013805":
        return "N01";
      case "36014510":
        return "N32";
      case "36013804":
        return "N02";
      case "36014086":
        return "N32";
      case "36013816":
        return "N31";
      case "36014610":
        return "N35";
      case "36013811":
        return "N23";
      default:
        return value;
    }
  }

  //OTR Confirmed Ship Mode and OB Shipment Mode
  mapOBShipmentModeAndOTRCSM(value){
    switch (value) {
      case "SEA":
        return "Ocean";
      case "ARC":
        return "Air";
      case "ARP":
        return "Factory Air";
      case "CRP":
        return "Air";
      case "ASP":
        return "Air";
      case "AIR":
        return "Air";
      case "SAB":
        return "Air";
      case "CRC":
        return "Air";
      case "SAV":
        return "Air";
      case "SAC":
        return "Ocean";
      case "SEP":
        return "Ocean";
      default:
        return value;
    }
  }

  //OTR Destination and OB Customer Code 
  mapOTRDestinationAndOBCustomerCode(value){
    switch (value) {
      case "ARINT1106":
        return "USA03";
      case "ARINT1283":
        return "CHN01";
      case "10007507":
        return "GBR01";
      case "ARINT1225":
        return "GBR01";
      case "1393":
        return "USA15";
      case "ARINT1104":
        return "USA02";
      default:
        return value;
    }
  }

  //OB and SA Mapping
  //OB Shipment Mode and SA Mode
  mapOBShipmentModeAndSAMode(value){
    switch (value) {
      case "SEA":
        return "SEA";
      case "ARC":
        return "AIR";
      case "ARP":
        return "AIR";
      case "CRP":
        return "COURIER";
      default:
        return value;
    }
  }

  //SA Destination and OB Destination 
  mapSADestinationAndOBDestination(value){
    switch (value) {
      case "CAN01":
        return "CAN01";
      case "CAN02":
        return "CAN02";
      case "US01":
        return "US01";
      case "USA03":
        return "USA03";
      case "GBR01":
        return "GBR01";
      case "CHN01":
        return "CHN01";  
      default:
        return value;
    }
  }

  //SA Destination and OB Destination 
  mapSAProductionFactoryAndOBProdWH(value){
    switch (value) {
      case "N09 - BASL - Avissawella I Prod WH":
        return "N09";
      case "N03 - BIA - Minuwangoda Prod WH":
        return "N03";
      case "N01 - BASL - Mirigama Prod WH":
        return "N01";
      case "N27 - BASL - Avissavella II -Prod WH":
        return "N27";
      case "N34 - BASL_BFF -Sub_Watupitiwala":
        return "N34";
      case "N12 - BIA - Welisara Sub Con Prod WH ":
        return "N12";
      case "N33 -BASL_BFF_Sub (BCW)Prod WH":
        return "N33";
      case "N02 - BASL - Welisara Prod WH":
        return "N02";
      case "N23 - BASL - Mirigama II Prod WH":
        return "N23";
      default:
        return value;
    }
  }

  //OB and OLR Mapping
  //OLR Factory Id and OB-InternalPlantCode
  mapFactoryIDAndProdWH(value){
    switch (value) {
      case "36013821":
        return "N09";
      case "36013778":
        return "N03";
      case "36013805":
        return "N01";
      case "36014510":
        return "N32";
      case "36013804":
        return "N02";
      case "36014086":
        return "N32";
      case "36013816":
        return "N31";
      case "36014610":
        return "N35";
      case "36013811":
        return "N23";
      default:
        return value;
    }
  }

  //OLR Shipmode and OB shipment Mode
  mapShipModeAndShipmentMode(value){
    switch (value) {
      case "SEA":
        return "Ocean";
      case "ARC":
        return "Air";
      case "ARP":
        return "Factory Air";
      case "CRP":
        return "Air";
      case "ASP":
        return "Air";
      case "AIR":
        return "Air";
      case "SAB":
        return "Air";
      case "CRC":
        return "Air";
      case "SAV":
        return "Air";
      case "SAC":
        return "Ocean";
      case "SEP":
        return "Ocean";
      default:
        return value;
    }
  }

  //OLR Cust code And OB Destination
  mapOLRCustCodeAndOBDestination(value){
    switch (value) {
      case "ARINT1106":
        return "USA03";
      case "ARINT1283":
        return "CHN01";
      case "10007507":
        return "GBR01";
      case "ARINT1225":
        return "GBR01";
      case "1393":
        return "USA15";
      case "ARINT1104":
        return "USA02";
      default:
        return value;
    }
  }

}

