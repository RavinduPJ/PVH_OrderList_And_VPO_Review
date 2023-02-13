// Development Testing - RavinduJ - Starts ---------------------------------------------------------------------------------------------------------

import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Component } from "@angular/core";
import { ViewChild, ElementRef } from "@angular/core";
import * as XLSX from "xlsx";
import { APLOBKEYS, SPSWRKEYS, PVHSSKEYS, AAVPOKEYS, CLKEYS, AASVPONEW } from "../../../constants/columnKeys";
import { DbconService } from "../../services/dbcon.service";
import { ComparisonModelComponent } from "./comparison-model/comparison-model.component";
import { ComparisonModelComponent2 } from "./comparison-model 2/comparison-model.component";
import { ComparisonModelComponent3 } from "./comparison-model 3/comparison-model.component";
import { ComparisonModelComponent4 } from "./comparison-model 4/comparison-model.component";
import { NbToastrService } from '@nebular/theme';
import { DatePipe } from '@angular/common'
@Component({
  selector: "ngx-ecommerce",
  templateUrl: "./bff.component3.html",
  styleUrls: ["./bff.component.scss"],
})
export class bffComponent_3 {
  constructor(private DbconService: DbconService, public modalService: NgbModal, private toastr: NbToastrService, public datepipe: DatePipe) {
  }

  @ViewChild(ComparisonModelComponent) OORComparisionModel: ComparisonModelComponent;
  @ViewChild(ComparisonModelComponent2) OORComparisionModel2: ComparisonModelComponent2;
  @ViewChild(ComparisonModelComponent3) OORComparisionModel3: ComparisonModelComponent3;
  @ViewChild(ComparisonModelComponent4) OORComparisionModel4: ComparisonModelComponent4;
  @ViewChild("fileDropRef", { static: false }) fileDropEl: ElementRef;

  isOBProcessing: boolean;
  isOORProcessing: boolean;
  isOTRProcessing: boolean;
  isOLRProcessing: boolean;
  isSAProcessing: boolean;

  AASFileObject = null;
  PVHSSFileObject = null;
  APLOBFileObject = null;
  CLOGFileObject = null;
  SPSWFileObject = null;

  onFileChange(fileType, files) {
    switch (fileType) {
      case "AASFile":
        this.AASFileObject = files[0];
        break;
      case "GTNFile":
        this.PVHSSFileObject = files[0];
        break;
      case "OBVPOFile":
        this.APLOBFileObject = files[0];
        break;
      case "SPSWFile":
        this.SPSWFileObject = files[0];
        break;
      case "CLFile":
        this.CLOGFileObject = files[0];
        break;
      default:
        alert("invalid file type");
    }
  }

  async onUploadOB() {
    this.isOBProcessing = true;
    
    //Validate file availbity 
    if(this.APLOBFileObject == null){
      this.toastr.warning("", "APL - Order Book is missing!"); 
    }

    //  STEP1 - Read file
    const APLOBFileJson = await this.readExcelFile(this.APLOBFileObject, APLOBKEYS);
    const finalAPLOBFileData = []

    //  STEP2 - Manupilate unique keys
    for (const row of APLOBFileJson) {
      const APLOBUniqueKey =
        this.formatToString(row["VPONo"]) + "-" +
        this.formatToString(row["CustStyleNo"]).split("/")[0] + "-" +
        this.formatToString(row["ColorName"]).slice(-3) + "-" +
        this.formatToString(row["COQty"])

      row["APLOBVPOKey"] = APLOBUniqueKey;

      const APLOBUniqueKey2 =
      this.formatToString(row["CustStyleNo"]).split("/")[0]+ "-" +
      this.formatToString(row["ColorName"]).slice(-3);

      row["APLOBVPOKey2"] = APLOBUniqueKey2;

      finalAPLOBFileData.push(row);
    }

    //  STEP3 - Delete existing table in indexedDB & insert data to IndexedDB
    const dbInserResponse = await this.DbconService.addBulk("aplob", finalAPLOBFileData);
    
    //STEP4 - Success toast
    this.toastr.success("", "APL - OB successfully uploaded!"); 
    
    //  END OF METHOD
    this.isOBProcessing = false;
  }

  // on Compare OOR
  async onCompareGTN() {
    this.isOORProcessing = true;

    //Validate file availbity 
    if(this.PVHSSFileObject == null){
      this.toastr.warning("", "PVH Shipment Status file is missing!"); 
    }

    //  STEP1 - Read file
    const PVHSSFileJson = await this.readExcelFile(this.PVHSSFileObject, PVHSSKEYS);
    const formattedPVHSSFileData = [];

    //  STEP2 - Manupilate unique key
    for (const row of PVHSSFileJson) {
      const PVHSSUniqueKey =
      row["PO1"] + "-" +
      this.formatToString(row["BuyerItem"]).split("/")[0] + "-" + //testing
      this.formatToString(row["Color"]).slice(-3) + "-" +
      row["CustomsUnits"];

      row["PVHSSVPOKey"] = PVHSSUniqueKey;

      formattedPVHSSFileData.push(row);
    }

    // NOTE: NO need to insert to db as data is processiong on clientSide
    // STEP - Delete existing table in indexedDB & insert data to IndexedDB

    //Need to insert data in the client side to the download funtion
    const dbInserResponse = await this.DbconService.addBulk("pvhss", formattedPVHSSFileData);

    // STEP3 - process OOR data and find matching OB data row on indexedDB
    const OORMatchedOBRows = [];
    for (const row of formattedPVHSSFileData) {
      const OBMatchedRow = await this.DbconService.getByIndex(
        "aplob",
        "APLOBVPOKey",
        row.PVHSSVPOKey
        );
        console.log("OBMatchedRow" + OBMatchedRow);
        console.log(row);
        // STEP3.1 - manupilate JSON objet for compare model
      let compositeKey, VPONo, CustStyleNo, ColorName, GarmentFabrication, ReqDelDate, COQty, FOBPrice, Destination, PlannerDelDate, ShipmentMode, DeliveryTerm, StyleNo, ProductGroup, CPO, ZOption;
      if (OBMatchedRow) {
        compositeKey = row.PVHSSVPOKey,

        VPONo = OBMatchedRow.VPONo,
        CustStyleNo = OBMatchedRow.CustStyleNo,
        ColorName = OBMatchedRow.ColorName,

        GarmentFabrication = OBMatchedRow.GarmentFabrication,
        ReqDelDate = OBMatchedRow.ReqDelDate,
        COQty = OBMatchedRow.COQty,
        FOBPrice = OBMatchedRow.FOBPrice,
        Destination = OBMatchedRow.Destination,
        PlannerDelDate = OBMatchedRow.PlanDelDate,
        ShipmentMode = OBMatchedRow.ShipmentMode,
        DeliveryTerm = OBMatchedRow.DeliveryTerm,
        StyleNo = OBMatchedRow.StyleNo,
        CPO = OBMatchedRow.CPONo,
        ZOption = OBMatchedRow.ZOption
      }else{
        compositeKey = row.PVHSSVPOKey,
        GarmentFabrication = "",
        ReqDelDate = "",
        COQty = "",
        FOBPrice = "",
        Destination = "",
        PlannerDelDate = "",
        ShipmentMode = "",
        DeliveryTerm = "",
        StyleNo = "",
        CPO = "",
        ZOption = ""
      }
      OORMatchedOBRows.push({
        compositeKey: compositeKey,
        // OB FILE Fields
        VPONo: VPONo,
        CustStyleNo: CustStyleNo,
        ColorName: ColorName,

        GarmentFabrication:GarmentFabrication,
        ReqDelDate: this.formatDatesOB(ReqDelDate),
        ReqDelDateComp: this.addDays(this.formatDatesOB(ReqDelDate), 7),
        COQty: COQty,
        FOBPrice: FOBPrice,
        Destination: Destination,
        PlanDelDate: this.formatDatesOB(PlannerDelDate),
        PlanDelDateComp: this.addDays(this.formatDatesOB(PlannerDelDate), 9),
        ShipmentMode: ShipmentMode,
        ShipmentModeComp: this.mapShipMode(ShipmentMode).toLowerCase(),
        DeliveryTerm: DeliveryTerm,
        StyleNo: StyleNo,
        CPO: CPO,
        ZOption: ZOption,
        // OOR FILE Fields
        PO: row.PO1,
        BuyerItem: row.BuyerItem,
        Color: row.Color,

        FabricContent: row.FabricContent,
        FabricContentComp: this.mapFabricContentandGarmentFabrication(GarmentFabrication),
        SWED: this.formatExcelDateToDateObj(row.ShipWindowEndDate),
        Quantity: row.Quantity,
        UnitPrice: row.UnitPrice,
        Country: row.Country,
        PlannerDelDate: PlannerDelDate,
        LineShipMethod: this.formatToString(row.LineShipmentMethod).toLowerCase(),
        DeliveryTerm1: row.DeliveryTerm,
        DeliveryTermComp: this.mapDeliveryTerm(row.DeliveryTerm),
        SeasonYear: row.SeasonYear,
        OrderType: row.OrderType,
        POSource: row.POSource,
        CustomsUnits: row.CustomsUnits
      });
    }

    //STEP4 - success message toast
    this.toastr.success("", "GTN Report successfully uploaded!"); 
    // STEP5 - Trigger data comparison model
    this.OORComparisionModel.openModel(OORMatchedOBRows);

    //  END OF METHOD
    this.isOORProcessing = false; // REVISIT
  }

  async onUploadGTN() {
    this.isOBProcessing = true;
    
    //Validate file availbity 
    if(this.PVHSSFileObject == null){
      this.toastr.warning("", "GTN Report is missing!"); 
    }

    //  STEP1 - Read file
    const PVHSSFileJson = await this.readExcelFile(this.PVHSSFileObject, PVHSSKEYS);
    const finalPVHSSFileData = []

    //  STEP2 - Manupilate unique keys
    for (const row of PVHSSFileJson) {
      const PVHSSUniqueKey =
      row["PO1"] + "-" +
      row["BuyerItem"].split("/")[0] + "-" + //testing
      row["Color"].slice(-3) + "-" +
      row["CustomsUnits"];

      row["PVHSSVPOKey"] = PVHSSUniqueKey;

      finalPVHSSFileData.push(row);
    }

    //  STEP3 - Delete existing table in indexedDB & insert data to IndexedDB
    const dbInserResponse = await this.DbconService.addBulk("pvhss", finalPVHSSFileData);
    
    //STEP4 - Success toast
    this.toastr.success("", "GTN Report successfully uploaded!"); 
    
    //  END OF METHOD
    this.isOBProcessing = false;
  }


  async onCompareSPSW() {
    this.isOORProcessing = true;

    //Validate file availbity 
    if(this.SPSWFileObject == null){
      this.toastr.warning("", "Shipment Plan Size Wise file is missing!"); 
    }

    //  STEP1 - Read file
    const SPSWFileJson = await this.readExcelFile(this.SPSWFileObject, SPSWRKEYS);
    const formattedSPSWFileData = [];

    //  STEP2 - Manupilate unique key
    for (const row of SPSWFileJson) {
      const SPSWUniqueKey =
      row["MPO"] + "-" +
      this.formatToString(row["CusStyleNumber"]).split("/")[1] + "-" +
      this.formatToString(row["Color"]).trim().slice(-3) + "-" +
      row["OrderQty"];

      row["SPSWRKey"] = SPSWUniqueKey;

      formattedSPSWFileData.push(row);
    }

    // NOTE: NO need to insert to db as data is processiong on clientSide
    // STEP - Delete existing table in indexedDB & insert data to IndexedDB

    //Need to insert data in the client side to the download funtion
    const dbInserResponse = await this.DbconService.addBulk("spswr", formattedSPSWFileData);

    // STEP3 - process OOR data and find matching OB data row on indexedDB
    const OORMatchedOBRows = [];
    for (const row of formattedSPSWFileData) {
      const OBMatchedRow = await this.DbconService.getByIndex(
        "pvhss",
        "PVHSSVPOKey",
        row.SPSWRKey
        );
//still under development
        // STEP3.1 - manupilate JSON objet for compare model
      let compositeKey, Size, Quantity;
      if (OBMatchedRow) {
        compositeKey = row.SPSWRKey,
        Size = OBMatchedRow.Size,
        Quantity = OBMatchedRow.Quantity

      }else{
        compositeKey = row.SPSWRKey,
        Size = "",
        Quantity = ""
      }
      OORMatchedOBRows.push({
        compositeKey: compositeKey,
        // OB FILE Fields
        Size: Size,
        Quantity: Quantity,
        // OOR FILE Fields
        Size1: row.Size,
        OrderQty: row.OrderQty
      });
    }

    //STEP4 - success message toast
    this.toastr.success("", "PVH Shipment Status successfully uploaded!"); 
    // STEP5 - Trigger data comparison model
    this.OORComparisionModel2.openModel(OORMatchedOBRows);

    //  END OF METHOD
    this.isOORProcessing = false; // REVISIT
  }

  async onUploadAA() {
    this.isOBProcessing = true;
    
    //Validate file availbity 
    if(this.AASFileObject == null){
      this.toastr.warning("", "GTN Report is missing!"); 
    }

    //  STEP1 - Read file
    const AASFileJson = await this.readExcelFile(this.AASFileObject, AASVPONEW);
    const finalAASFileData = []

    //  STEP2 - Manupilate unique keys
    for (const row of AASFileJson) {
      const AASUniqueKey =
      row["AA"] + "-" +
      this.formatToString(row["Style"]).split("/")[0] + "-" + //testing
      this.formatToString(row["StyleColor"]).slice(-3) + "-" +
      row["Units"];

      row["AASVPOKey"] = AASUniqueKey;

      finalAASFileData.push(row);
    }

    //  STEP3 - Delete existing table in indexedDB & insert data to IndexedDB
    const dbInserResponse = await this.DbconService.addBulk("aas", finalAASFileData);
    
    //STEP4 - Success toast
    this.toastr.success("", "AA Summary Report successfully uploaded!"); 
    
    //  END OF METHOD
    this.isOBProcessing = false;
  }


  // on Compare OOR
  async onCompareGTN2() {
    this.isOORProcessing = true;

    //Validate file availbity 
    if(this.PVHSSFileObject == null){
      this.toastr.warning("", "PVH Shipment Status file is missing!"); 
    }

    //  STEP1 - Read file
    const PVHSSFileJson = await this.readExcelFile(this.PVHSSFileObject, PVHSSKEYS);
    const formattedPVHSSFileData = [];

    //  STEP2 - Manupilate unique key
    for (const row of PVHSSFileJson) {
      const PVHSSUniqueKey =
      row["PO1"] + "-" +
      this.formatToString(row["BuyerItem"]).split("/")[0] + "-" + //testing
      this.formatToString(row["Color"]).slice(-3) + "-" +
      row["CustomsUnits"];

      row["PVHSSVPOKey"] = PVHSSUniqueKey;

      formattedPVHSSFileData.push(row);
    }

    // NOTE: NO need to insert to db as data is processiong on clientSide
    // STEP - Delete existing table in indexedDB & insert data to IndexedDB

    //Need to insert data in the client side to the download funtion
    const dbInserResponse = await this.DbconService.addBulk("pvhss", formattedPVHSSFileData);

    // STEP3 - process OOR data and find matching OB data row on indexedDB
    const OORMatchedOBRows = [];
    for (const row of formattedPVHSSFileData) {
      const OBMatchedRow = await this.DbconService.getByIndex(
        "aplob",
        "APLOBVPOKey",
        row.PVHSSVPOKey
        );
        console.log("OBMatchedRow" + OBMatchedRow);
        console.log(row);
        // STEP3.1 - manupilate JSON objet for compare model
      let compositeKey1, ReqDelDate, COQty, PlanDelDate;
      if (OBMatchedRow) {
        compositeKey1 = row.PVHSSVPOKey,

        ReqDelDate = OBMatchedRow.ReqDelDate,
        PlanDelDate = OBMatchedRow.PlanDelDate,
        COQty = OBMatchedRow.COQty

      }else{
        compositeKey1 = row.PVHSSVPOKey,
        ReqDelDate = "",
        PlanDelDate = "",
        COQty = ""
      }

      const OBMatchedRow2 = await this.DbconService.getByIndex(
        "aas",
        "AASVPOKey",
        row.PVHSSVPOKey
        );
        console.log("OBMatchedRow" + OBMatchedRow2);
        console.log(row);
        // STEP3.1 - manupilate JSON objet for compare model
      let compositeKey2, CFMSailBy, Units;
      if (OBMatchedRow2) {
        compositeKey2 = row.PVHSSVPOKey,

        CFMSailBy = this.formatExcelDateToDateObj(OBMatchedRow2.CFMSailBy),
        Units = OBMatchedRow2.Units
      }else{
        compositeKey2 = row.PVHSSVPOKey,
        CFMSailBy = "",
        Units = ""
      }

      OORMatchedOBRows.push({
        compositeKey: compositeKey1,
        // OB FILE Fields
        ReqDelDate: this.formatDatesOB(ReqDelDate),
        ReqDelDateComp: this.addDays(this.formatDatesOB(ReqDelDate), 7),
        PlanDelDate: this.formatDatesOB(PlanDelDate),
        PlanDelDateComp: this.addDays(this.formatDatesOB(PlanDelDate), 9),
        COQty: COQty,

        CFMSailBy: this.formatDatesOB(CFMSailBy),
        Units: Units,

        // OOR FILE Fields
        ShipWindowEndDate: this.formatExcelDateToDateObj(row.ShipWindowEndDate),
        CustomsUnits: row.CustomsUnits,
      });
    }

    //STEP4 - success message toast
    this.toastr.success("", "PVH Shipment Status successfully uploaded!"); 
    // STEP5 - Trigger data comparison model
    this.OORComparisionModel3.openModel(OORMatchedOBRows);

    //  END OF METHOD
    this.isOORProcessing = false; // REVISIT
  }


    // on Compare OOR
    async onCompareCL() {
      this.isOORProcessing = true;
  
      //Validate file availbity 
      if(this.CLOGFileObject == null){
        this.toastr.warning("", "PVH Shipment Status file is missing!"); 
      }
  
      //  STEP1 - Read file
      const CLFileJson = await this.readExcelFile(this.CLOGFileObject, CLKEYS);
      const formattedCLFileData = [];
  
      //  STEP2 - Manupilate unique key
      for (const row of CLFileJson) {
        const CLUniqueKey =
        this.formatToString(row["StyleNumber"]).split("/")[0] + "-" +
        this.formatToString(row["NRFNumber"]).slice(-3);
  
        row["CLVPOKey"] = CLUniqueKey;
  
        formattedCLFileData.push(row);
      }
  
      // NOTE: NO need to insert to db as data is processiong on clientSide
      // STEP - Delete existing table in indexedDB & insert data to IndexedDB
  
      //Need to insert data in the client side to the download funtion
      const dbInserResponse = await this.DbconService.addBulk("clog", formattedCLFileData);

      const test = await this.DbconService.getAllArray("aplob");
      // console.log(test);
  
      // STEP3 - process OOR data and find matching OB data row on indexedDB
      const OORMatchedOBRows = [];
      for (const row of test) {
        const OBMatchedRow = await this.DbconService.getByIndex(
          "clog",
          "CLVPOKey",
          row.APLOBVPOKey2
          );
          console.log("OBMatchedRow" + OBMatchedRow);
          console.log(row);
          // STEP3.1 - manupilate JSON objet for compare model
        let compositeKey1, MMX, BUR, ROSS;
        if (OBMatchedRow) {
          compositeKey1 = row.APLOBVPOKey2,
  
          MMX = OBMatchedRow.MMX,
          BUR = OBMatchedRow.BUR,
          ROSS = OBMatchedRow.ROSS
        }else{
          compositeKey1 = row.APLOBVPOKey2,
          MMX = "",
          BUR = "",
          ROSS = ""
        }
  
        const OBMatchedRow2 = await this.DbconService.getByIndex(
          "pvhss",
          "PVHSSVPOKey",
          row.APLOBVPOKey
          );
          console.log("OBMatchedRow" + OBMatchedRow2);
          console.log(row);
          // STEP3.1 - manupilate JSON objet for compare model
        let compositeKey2, UnitPrice;
        if (OBMatchedRow2) {
          compositeKey2 = row.APLOBVPOKey,
  
          UnitPrice = OBMatchedRow2.UnitPrice
        }else{
          compositeKey2 = row.APLOBVPOKey,
          UnitPrice = ""
        }

        const OBMatchedRow3 = await this.DbconService.getByIndex(
          "aas",
          "AASVPOKey",
          row.APLOBVPOKey
          );
          console.log("OBMatchedRow" + OBMatchedRow3);
          console.log(row);
          // STEP3.1 - manupilate JSON objet for compare model
        let compositeKey3, FOBPriceAA, RevisedFOB;
        if (OBMatchedRow3) {
          compositeKey3 = row.APLOBVPOKey,
  
          FOBPriceAA = OBMatchedRow3.FOBPrice,
          RevisedFOB = OBMatchedRow3.RevisedFOB
        }else{
          compositeKey3 = row.APLOBVPOKey,
          FOBPriceAA = "",
          RevisedFOB = ""
        }
  
        OORMatchedOBRows.push({
          compositeKey: row.APLOBVPOKey,
          // OB FILE Fields
          FOBPrice: row.FOBPrice,
          MMX: MMX,
          BUR: BUR,
          ROSS: ROSS,
          UnitPrice: UnitPrice,
          
          FOBorRFOB: this.mapAvailability(FOBPriceAA, RevisedFOB),

          CLLogic: this.mapCostLogLogic(this.formatToString(row.CustStyleNo).split("/")[1], MMX, BUR, ROSS)
        });
      }
  
      //STEP4 - success message toast
      this.toastr.success("", "Cost Log successfully uploaded!"); 
      // STEP5 - Trigger data comparison model
      this.OORComparisionModel4.openModel(OORMatchedOBRows);
  
      //  END OF METHOD
      this.isOORProcessing = false; // REVISIT
    }
  

  // Development Testing - RavinduJ - Ends ---------------------------------------------------------------------------------------------------------


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

  // Development - starts -------------------------------------------------------------------------------------------------------------
  
  mapDeliveryTerm(value){
    if(this.formatToString(value).includes("FOB")){
      return "FOB";
    }
    else if(this.formatToString(value).includes("FCA")){
      return "FCA";
    }else{
      return value;
    }
  }

  mapAvailability(value1, value2){
    if(value1){
      return value1;
    }else{
      return value2;
    }
  }

  addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return this.convert(result);
  }

  convert(str) {
    var date = new Date(str),
      mnth = ("0" + (date.getMonth() + 1)).slice(-2),
      day = ("0" + date.getDate()).slice(-2);
    return [date.getFullYear(), mnth, day].join("-");
  }

  mapCostLogLogic(value1, MMX, BUR, ROSS){
    
    // const stringLength = value1.length();
    // console.log(value1 + " - " + stringLength);

    if(this.formatToString(value1).includes("X")== true){
      return MMX;
    }
    else if (this.formatToString(value1).includes("U")== true){
      return BUR;
    }
    else if (this.formatToString(value1).includes("R")== true){
      return ROSS;
    }
    else {
      return value1;
    }
  }

  mapShipMode(value){
    switch(value){
      case "SEA":
        return "Ocean";
      case "AIR":
        return "AIR";
      default:
        return value; 
    }
  }

  mapFabricContentandGarmentFabrication(value){
    switch(value){
      case "POLY75NY25":
        return "PES 75 % PA 25%";
      case "MDL97EL3":
        return "97% MICRO MODAL 3% SPANDEX";
      case "CT96SP4":
        return "96% COTTON 4% ELASTANE";
      case "ORG100CTTN":
        return "100% COTTON";
      case "67BM28CT5E":
        return "67% BAMBOO 28% COTTON 5% ELASTANE";
      case "CT100":
        return "100% COTTON";
      case "CT98EL2":
        return "CO 98 % EL 2 %/98% COTTON 2% ELASTANE/98% COTTON 2% SPANDEX";
      case "CT95SP5":
        return "95% COTTON 5% SPANDEX";
      case "96CMCON4EL":
        return "96% MICRO MODAL 4% ELASTANE";
      case "MDL97EL3":
        return "97% MICRO MODAL 3% SPANDEX";
      case "100Polyest":
        return "100% POLYESTER";
      case "PE100":
        return "100% POLYESTER";
      case "49C36AC15V":
        return "49% COTTON 36% ACRYLIC 15% VISCOSE";
      case "55Ct+37+8%":
        return "CO 55 % CMD 37 % EL 8 %";
      case "100":
        return "100% COTTON";
      case "95Ctn5Elst":
        return "95% COTTON 5% ELASTANE";
      case "70CT30PEST":
        return "CKNA related one";
      case "100Supima":
        return "CKNA related one";
      case "CT57PO38S5":
        return "57% COTTON, 38% POLYESTER, 5% SPANDEX";
      case "CT95EL5":
        return "95% COTTON 5% ELASTANE";
      case "CT60PLY40":
        return "60% COTTON 40% POLYESTER";
      case "CT60EST40":
        return "60% COTTON 40% POLYESTER";
      case "60BC40PET":
        return "60% COTTON 40% POLYESTER";
      case "96MODAL4S":
        return "96% MICRO MODAL 4% ELASTANE";
      case "58CT39RECY":
        return "CO 58 % RPE 39 % EL 3 %";
      case "57CT38PEST":
        return "57% COTTON, 38% POLYESTER, 5% ELASTANE";
      case "78CT22SE":
        return "78% NYLON 22% ELASTANE";
      case "74BCICTN21":
        return "74% BCI COTTON  21% RECYLED COTTON 5% ELASTANE";
      case "78CT22SPA":
        return "78%POLYESTER 22%SPANDEX";
      case "69BCI21RC1":
        return "69% BCI COTTON, 21% RECYCLED COTTON, 10% LOWSET ELASTANE";
      case "78CN22SCL":
        return "78% COTTON, 22% SEA CELL";
      case "57%CT38%":
        return "57% COTTON, 38% POLYESTER, 5% ELASTANE";
      case "69BCICT21E":
        return "69% BCI COTTON, 21% RECYCLED COTTON, 10% LOWSET ELASTANE";
      case "CT96EL4":
        return "CO 96 % EL 4 %";
      case "57CTN38P5E":
        return "57% COTTON, 38% POLYESTER, 5% ELASTANE";
      case "69CTN21REC":
        return "69% BCI COTTON, 21% RECYCLED COTTON, 10% LOWSET ELASTANE";
      case "CT65PLY35":
        return "CKNA related one";
      case "CT98SP2":
        return "CO 98 % EL 2 %/98% COTTON 2% ELASTANE/98% COTTON 2% SPANDEX";
      case "98CT2SPND":
        return "CO 98 % EL 2 %/98% COTTON 2% ELASTANE/98% COTTON 2% SPANDEX";
      case "92CTN8PTR":
        return "CKNA related one";
      case "CT92EL8":
        return "CKNA related one";
      case "92CT8PEST":
        return "CKNA related one";
      case "PO100":
        return "PES 100 %";
      case "CT100SESU":
        return "100% COTTON";
      case "96MCRM4SPN":
        return "96% MICRO MODAL 4% ELASTANE";
      case "79NYL21ELS":
        return "79%POLYESTER21%ELASTANE";
      case "57CT38RP5S":
        return "57% COTTON, 38% POLYESTER, 5% ELASTANE";
      case "57BC38CT5E":
        return "57% COTTON, 38% POLYESTER, 5% ELASTANE";
      case "79NY21EL":
        return "79%POLYESTER21%ELASTANE";
      case "55CO37MO":
        return "CO 55 % CMD 37 % EL 8 %";
      case "97CTN3ELS":
        return "97% COTTON, 3% ELASTANE";
      case "55CT37MOD8":
        return "CO 55 % CMD 37 % EL 8 %";
      case "MDL65PLY35":
        return "CKNA related one";
      case "95BCICO5EL":
        return "95% COTTON 5% ELASTANE";
      case "87CN13ET":
        return "87% COTTON, 13% ELASTANE";
      case "74CT24RC2S":
        return "CO 74 % RCO 24 % EL 2 %";
      case "CT58RY39S3":
        return "CO 58 % RPE 39 % EL 3 %";
      case "85MOD9CA6":
        return "CMD 85 % WS 9 % EL 6 %";
      case "POLY75NY25":
        return "PES 75 % PA 25%";
      case "85%SI9%Ca6":
        return "CMD 85 % WS 9 % EL 6 %";
      case "SC95EL5":
        return "95% COTTON 5% ELASTANE";
      case "97MCMO3SPN":
        return "CMD 97 % EL 3 %";
      case "95CTN5SPX":
        return "95% COTTON 5% SPANDEX";
      case "96ORGCT4ES":
        return "CO 96 % EL 4 %";
      case "57CO38RE5":
        return "57% COTTON, 38% POLYESTER, 5% ELASTANE";
      case "CT95SP5A":
        return "95% COTTON 5% SPANDEX";
      case "57CT38EST5":
        return "57% COTTON, 38% POLYESTER, 5% ELASTANE";
      case "57CO36PO5S":
        return "57% COTTON, 38% POLYESTER, 5% ELASTANE";
      case "PO55CT37":
        return "CO 55 % EL 8 % CMD 37 %";
      case "100CMPCT":
        return "100% COTTON";
      case "60CT40PLY":
        return "60% COTTON 40% POLYESTER";
      case "100BCICTTN":
        return "100% COTTON";
      case "100TENCEL":
        return "100% LYOCELL";
      case "74PET21T5E":
        return "74% BCI COTTON  21% RECYLED COTTON 5% ELASTANE";
      case "96%CT4%EL":
        return "CO 96 % EL 4 %";
      case "93ORCTN7EL":
        return "OCO 93 % EL 7 %";
      case "93BCICT7EL":
        return "OCO 93 % EL 7 %";
      case "TE100":
        return "100% LYOCELL";
      case "87PIM13LYC":
        return "87% PIMA COTTON, 13% LYCR";
      case "74CT24RT2E":
        return "CO 74 % RCO 24 % EL 2 %";
      case "CT93ELS7":
        return "93% COTTON 7% ELASTANE";
      case "100PEST":
        return "100% POLYESTER";
      case "100BCICMCT":
        return "CKNA related one";
      case "98BCICT2SP":
        return "CO 98 % EL 2 %/98% COTTON 2% ELASTANE/98% COTTON 2% SPANDEX";
      case "TestFabric":
        return "TestFabric";
      default:
        return value;
    }
  }
  
  // Development - ends -------------------------------------------------------------------------------------------------------------
}

