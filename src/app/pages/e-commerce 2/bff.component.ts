// Development Testing - RavinduJ - Starts ---------------------------------------------------------------------------------------------------------

import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Component } from "@angular/core";
import { ViewChild, ElementRef } from "@angular/core";
import * as XLSX from "xlsx";
import { AASKEYS, PVHSSKEYS, OBKEYS, OTRKEYS, SAKEYS, OLRKEYS, APLOBKEYS, M3SPKEYS, } from "../../../constants/columnKeys";
import { DbconService } from "../../services/dbcon.service";
import { ComparisonModalShipmentComponent } from "./comparison-modal-shipment/comparison-modal-shipment.component";
import { ComparisonModelComponent } from "./comparison-model/comparison-model.component";
import { ComparisonModelComponent2 } from "./comparison-model 2/comparison-model.component";
import { ComparisonModelComponent3 } from "./comparison-model 3/comparison-model.component";
import { NbToastrService } from '@nebular/theme';
import { DatePipe } from '@angular/common'
import { POINT_CONVERSION_COMPRESSED } from "constants";
import { validateVerticalPosition } from "@angular/cdk/overlay";
import { splitAtColon } from "@angular/compiler/src/util";
@Component({
  selector: "ngx-ecommerce",
  templateUrl: "./bff.component2.html",
  styleUrls: ["./bff.component.scss"],
})
export class bffComponent_2 {
  constructor(private DbconService: DbconService, public modalService: NgbModal, private toastr: NbToastrService, public datepipe: DatePipe) {
  }

  @ViewChild(ComparisonModelComponent) OORComparisionModel: ComparisonModelComponent;
  @ViewChild(ComparisonModalShipmentComponent) SAComparisionModel: ComparisonModalShipmentComponent;
  @ViewChild(ComparisonModelComponent2) OORComparisionModel2: ComparisonModelComponent2;
  @ViewChild(ComparisonModelComponent3) OORComparisionModel3: ComparisonModelComponent3;
  @ViewChild("fileDropRef", { static: false }) fileDropEl: ElementRef;

  isOBProcessing: boolean;
  isOORProcessing: boolean;
  isOTRProcessing: boolean;
  isOLRProcessing: boolean;
  isSAProcessing: boolean;


  AASFileObject = null;
  PVHSSFileObject = null;
  APLOBFileObject = null;
  M3SPFileObject = null;
  OBFileObject = null;

  OTRFileObject = null;
  OLRFileObject = null;
  SAFileObject = null;

  onFileChange(fileType, files) {
    switch (fileType) {
      case "OBFile":
        this.OBFileObject = files[0];
      case "AASFile":
        this.AASFileObject = files[0];
        break;
      case "PVHSSFile":
        this.PVHSSFileObject = files[0];
        break;
      case "APLOBFile":
        this.APLOBFileObject = files[0];
        break;
      case "M3SPFile":
        this.M3SPFileObject = files[0];
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

      const SAUniqueKey =
        this.formatSubString(row["custStyleNo"], 6) +
        this.formatSubString(row["colorName"], 4) +
        this.formatToString(row["VPONo"]) +
        this.formatToString(row["COQty"]);
        
      row["SAKey"] = SAUniqueKey;

      finalOBFileData.push(row);
    }

    //  STEP3 - Delete existing table in indexedDB & insert data to IndexedDB
    const dbInserResponse = await this.DbconService.addBulk("bffOrderBook", finalOBFileData);
    
    //STEP4 - Success toast
    this.toastr.success("", "OB file successfully uploaded!"); 
    
    //  END OF METHOD
    this.isOBProcessing = false;
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


  // on upload OB File (Master data)
  async onUploadAAS() {
    this.isOBProcessing = true;
    
    //Validate file availbity 
    if(this.AASFileObject == null){
      this.toastr.warning("", "AA Sheet is missing!"); 
    }

    //  STEP1 - Read file
    const AASFileJson = await this.readExcelFile(this.AASFileObject, AASKEYS);
    const finalAASFileData = []

    //  STEP2 - Manupilate unique keys
    for (const row of AASFileJson) {
      
        const AASUniqueKey1 =
          this.formatToString(row["CustomerStyle"]) + "-" +
          this.formatToString(row["Color"]) + "-" +
          this.formatToString(row["FGPO"]) + "-" +
          this.formatToString(row["FinalQty"])
      
        const AASUniqueKey2 =
        this.formatToString(row["CustomerStyle"]) + "-" +
        this.formatToString(row["NRF"]) + "-" +
        this.formatToString(row["FGPO"]) + "-" +
        this.formatToString(row["FinalQty"])

      row["AASKey1"] = AASUniqueKey1;
      row["AASKey2"] = AASUniqueKey2;

      finalAASFileData.push(row);
    }

    //  STEP3 - Delete existing table in indexedDB & insert data to IndexedDB
    const dbInserResponse = await this.DbconService.addBulk("aas", finalAASFileData);
    
    //STEP4 - Success toast
    this.toastr.success("", "AA Sheet successfully uploaded!"); 
    
    //  END OF METHOD
    this.isOBProcessing = false;
  }

  // on Compare OOR
  async onCompareOOR() {
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
      row["BuyerItem"] + "-" +
      row["Color"] + "-" +
      row["PO1"] + "-" +
      row["Quantity"];

      const PVHSSUniqueKeyUI =
      row["BuyerItem"] + "-" +
      row["Color"] + "-" +
      row["PO1"] + "-" +
      row["Quantity"];

      row["PVHSSKey"] = PVHSSUniqueKey;
      row["PVHSSKeyUI"] = PVHSSUniqueKeyUI;

      formattedPVHSSFileData.push(row);
    }

    // NOTE: NO need to insert to db as data is processiong on clientSide
    // STEP - Delete existing table in indexedDB & insert data to IndexedDB

    //Need to insert data in the client side to the download funtion
    const dbInserResponse = await this.DbconService.addBulk("pvhss", formattedPVHSSFileData);

    // STEP3 - process OOR data and find matching OB data row on indexedDB
    const OORMatchedOBRows = [];
    for (const row of formattedPVHSSFileData) {
      if(row.Country == "INDIA" || row.Country == "NETHERLANDS" || row.Country == "CHINA" || row.Country == "KOREA" ||
      row.Country == "HONG KONG" || row.Country == "JAPAN" ) {
        const OBMatchedRow = await this.DbconService.getByIndex(
          "aas",
          "AASKey1",
          row.PVHSSKey
          );
          // console.log("OBMatchedRow" + OBMatchedRow);
          // console.log(row);
          // STEP3.1 - manupilate JSON objet for compare model
        let compositeKey, FOBorRFOB, RSBDorCSBD, ForRF, FOB, RFOB, RSBD, CSBD, Factory, RFactory, CustomerStyle, Color, NRF, FGPONumber, FinalQty;
        if (OBMatchedRow) {
          compositeKey = row.PVHSSKeyUI,
          
          CustomerStyle = OBMatchedRow.CustomerStyle,        
          Color = OBMatchedRow.Color,
          NRF = OBMatchedRow.NRF,
          FGPONumber = OBMatchedRow.FGPO,
          FinalQty = OBMatchedRow.FinalQty,
          
          FOB = this.formatToString(OBMatchedRow.FOBPrice),
          RFOB = this.formatToString(OBMatchedRow.RevisedFOB),
          FOBorRFOB = this.mapAvailability(RFOB, FOB),
  
          RSBD = this.formatExcelDateToDateObj(OBMatchedRow.ReqSailByDate),
          CSBD = this.formatExcelDateToDateObj(OBMatchedRow.CFMSailByDate),
          RSBDorCSBD = this.mapAvailability(CSBD, RSBD),
          console.log(RSBDorCSBD);
  
          Factory= this.formatToString(OBMatchedRow.Factory),
          RFactory = this.formatToString(OBMatchedRow.RevisedFactory),
          ForRF = this.mapAvailability(RFactory, Factory)
        
        }else{
          compositeKey = row.PVHSSKeyUI,
          FOBorRFOB = "",
          RSBDorCSBD = "",
          ForRF = ""
        }
        OORMatchedOBRows.push({
          compositeKey: compositeKey,
          // PVH SS Fields
          CustomerStyle: CustomerStyle,
          Color: Color,
          NRF: NRF,
          FGPONumber: FGPONumber,
          FinalQty: FinalQty,
          FOBorRFOB: this.formatToString(FOBorRFOB).slice(0, 5),
          RSBDorCSBD: RSBDorCSBD,
          ForRF:ForRF,
          ForRFComp: this.mapFactoryandMemberName(ForRF),
          // OOR FILE Fields
          BuyerItem: row.BuyerItem,
          ColorPVH: row.Color,
          PONumber: row.PO1,
          Quantity: row.Quantity,
          UnitPrice: this.formatToString(row.UnitPrice).slice(0, 5),
          ShipWindowEndDate: this.formatExcelDateToDateObj(row.ShipWindowEndDate),
          MemberName: row.MemberName,
        });
      }
      if( row.Country == "AUSTRALIA" || row.Country == "CANADA" || row.Country == "UNITED STATES" || row.Country == "PANAMA"
      || row.Country == "MEXICO" || row.Country == "BRAZIL" ){
        const OBMatchedRow = await this.DbconService.getByIndex(
          "aas",
          "AASKey2",
          row.PVHSSKey
          );
          // console.log("OBMatchedRow" + OBMatchedRow);
          // console.log(row);
          // STEP3.1 - manupilate JSON objet for compare model
        let compositeKey, FOBorRFOB, RSBDorCSBD, ForRF, FOB, RFOB, RSBD, CSBD, Factory, RFactory, CustomerStyle, Color, NRF, FGPONumber, FinalQty;
        if (OBMatchedRow) {
          compositeKey = row.PVHSSKeyUI,
          
          CustomerStyle = OBMatchedRow.CustomerStyle,        
          Color = OBMatchedRow.Color,
          NRF = OBMatchedRow.NRF,
          FGPONumber = OBMatchedRow.FGPO,
          FinalQty = OBMatchedRow.FinalQty,
          
          FOB = this.formatToString(OBMatchedRow.FOBPrice),
          RFOB = this.formatToString(OBMatchedRow.RevisedFOB),
          FOBorRFOB = this.mapAvailability(RFOB, FOB),
  
          RSBD = this.formatExcelDateToDateObj(OBMatchedRow.ReqSailByDate),
          CSBD = this.formatExcelDateToDateObj(OBMatchedRow.CFMSailByDate),
          RSBDorCSBD = this.mapAvailability(CSBD, RSBD),
          console.log(RSBDorCSBD);
  
          Factory= this.formatToString(OBMatchedRow.Factory),
          RFactory = this.formatToString(OBMatchedRow.RevisedFactory),
          ForRF = this.mapAvailability(RFactory, Factory)
        
        }else{
          compositeKey = row.PVHSSKeyUI,
          FOBorRFOB = "",
          RSBDorCSBD = "",
          ForRF = ""
        }
        OORMatchedOBRows.push({
          compositeKey: compositeKey,
          // PVH SS Fields
          CustomerStyle: CustomerStyle,
          Color: Color,
          NRF: NRF,
          FGPONumber: FGPONumber,
          FinalQty: FinalQty,
          FOBorRFOB: this.formatToString(FOBorRFOB).slice(0, 5),
          RSBDorCSBD: RSBDorCSBD,
          ForRF:ForRF,
          ForRFComp: this.mapFactoryandMemberName(ForRF),
          // OOR FILE Fields
          BuyerItem: row.BuyerItem,
          ColorPVH: row.Color,
          PONumber: row.PO1,
          Quantity: row.Quantity,
          UnitPrice: this.formatToString(row.UnitPrice).slice(0, 5),
          ShipWindowEndDate: this.formatExcelDateToDateObj(row.ShipWindowEndDate),
          MemberName: row.MemberName,
        });
      }
    }

    //STEP4 - success message toast
    this.toastr.success("", "OOR file successfully uploaded!"); 
    // STEP5 - Trigger data comparison model
    this.OORComparisionModel.openModel(OORMatchedOBRows);

    //  END OF METHOD
    this.isOORProcessing = false; // REVISIT
  }

  async onUploadAPLOB() {
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
        this.formatToString(row["CustStyleNo"]).split("/")[1] + "-" +
        this.formatToString(this.mapAPLOBColorCodeNRF(row["Destination"], row["VPONo"], row["ColorName"]))

      row["APLOBKey"] = APLOBUniqueKey;

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
  async onComparePVH2() {
    this.isOORProcessing = true;

    //Validate file availbity 
    if(this.PVHSSFileObject == null){
      this.toastr.warning("", "PVH Shipment Status file is missing!"); 
    }

    //  STEP1 - Read file
    const PVHSSFileJson = await this.readExcelFile(this.PVHSSFileObject, PVHSSKEYS);
    const formattedPVHSSFileData = [];

    //STEP2 - Create unique Key
    for (const row of PVHSSFileJson){
      const PVHSSTempKey =
        row["PO1"] + "-" +
        row["BuyerItem"] + "-" +
        row["Color"];
      
      row["PVHTempKey"] = PVHSSTempKey;     
      formattedPVHSSFileData.push(row);
    } 

    //STEP3 - Create unique key for size qty
    let groupedPVHSSRFileData = this.groupArray(formattedPVHSSFileData, 'PVHTempKey')
    for (const tempKey in groupedPVHSSRFileData) {
      let PVHQtySum = 0
      // calculate ORDERQTY sum
      for (const row of groupedPVHSSRFileData[tempKey]) {
        PVHQtySum += row.Quantity
      }
      // push rows with OLR Key
      for (const row of groupedPVHSSRFileData[tempKey]) {
        const PVHSSTempKey =
        row["PO1"] + "-" +
        row["BuyerItem"] + "-" +
        row["Color"];
  
        const PVHSSTempKeyUI =
          row["PO1"] + "-" +
          row["BuyerItem"] + "-" +
          row["Color"];

        row['PVHSSKey'] = PVHSSTempKey  
        row['PVHSSKeyUI'] = PVHSSTempKeyUI  
        
        row['PVHSSOrderQtySum'] = PVHQtySum
        formattedPVHSSFileData.push(row)
      }
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
        "APLOBKey",
        row.PVHSSKey
        );
        console.log("OBMatchedRow" + OBMatchedRow);
        console.log(row);
        // STEP3.1 - manupilate JSON objet for compare model
      let compositeKey, VPONo, CustStyleNo, Season, ColorName, GarmentFabrication, ReqDelDate, COQty, FOBPrice, Destination, PlannerDelDate, ShipmentMode, DeliveryTerm, StyleNo, ItemDescription, CPO, ZOption;
      if (OBMatchedRow) {
        compositeKey = row.PVHSSKeyUI,

        VPONo = OBMatchedRow.VPONo,
        CustStyleNo = OBMatchedRow.CustStyleNo,
        ColorName = OBMatchedRow.ColorName,

        GarmentFabrication = OBMatchedRow.GarmentFabrication,
        ReqDelDate = this.formatDatesOB(OBMatchedRow.ReqDelDate),
        COQty = OBMatchedRow.COQty,
        FOBPrice = OBMatchedRow.FOBPrice,
        Destination = OBMatchedRow.Destination,
        PlannerDelDate = this.addDays(this.formatDatesOB(OBMatchedRow.ReqDelDate), 2),
        ShipmentMode = OBMatchedRow.ShipmentMode,
        DeliveryTerm = OBMatchedRow.DeliveryTerm,
        Season = OBMatchedRow.Season,
        ItemDescription = OBMatchedRow.ItemDescription
        CPO = OBMatchedRow.CPONo,
        ZOption = OBMatchedRow.ZOption
      }else{
        compositeKey = row.PVHSSKeyUI,
        GarmentFabrication = "",
        ReqDelDate = "",
        COQty = "",
        FOBPrice = "",
        Destination = "",
        Season = "",
        PlannerDelDate = "",
        ShipmentMode = "",
        DeliveryTerm = "",
        StyleNo = "",
        ItemDescription = "",
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
        ReqDelDate: ReqDelDate,
        ReqDelDateComp: this.getPreviousMonday(this.formatExcelDateToDateObj(row.ShipWindowEndDate)),
        COQty: COQty,
        FOBPrice: FOBPrice,
        Destination: Destination,
        DestinationComp: this.mapCountryandDestination(Destination),
        PlanDelDate: PlannerDelDate,
        ShipmentMode: ShipmentMode,
        ShipmentModeComp: this.mapLineShipMethodandShipmentMode(ShipmentMode).toLowerCase(),
        DeliveryTerm: DeliveryTerm,
        Season: Season,
        ItemDescription: ItemDescription,
        CPO: CPO,
        ZOption: ZOption,
        ZOptionComp: this.mapPOSourceandZOption(ZOption),
        // OOR FILE Fields
        PO: row.PO1,
        BuyerItem: row.BuyerItem,
        Color: row.Color,

        FabricContent: row.FabricContent,
        FabricContentComp: this.mapFabricContentandGarmentFabrication(GarmentFabrication),
        SWED: this.formatExcelDateToDateObj(row.ShipWindowEndDate),
        Quantity: row.PVHSSOrderQtySum,
        UnitPrice: row.UnitPrice,
        Country: row.Country,
        PlannerDelDate: PlannerDelDate,
        LineShipMethod: this.formatToString(row.LineShipmentMethod).toLowerCase(),
        DeliveryTerm1: row.DeliveryTerm,
        SeasonName: row.Season,
        SeasonNameComp: this.mapSeasonPVH(row.SeasonName),
        LongDescription: row.LongDescription,
        OrderType: row.OrderType,
        OrderTypeComp: this.mapOrderTypeandCPO(row.OrderType),
        POSource: row.POSource
      });
    }

    //STEP4 - success message toast
    this.toastr.success("", "PVH Shipment Status successfully uploaded!"); 
    // STEP5 - Trigger data comparison model
    const key = 'compositeKey'
    const PVHSSUniqueRow = [...new Map(OORMatchedOBRows.map(item =>[item[key], item])).values()]

    this.OORComparisionModel2.openModel(PVHSSUniqueRow);

    //  END OF METHOD
    this.isOORProcessing = false; // REVISIT
  }




  async onUploadM3SP() {
    this.isOBProcessing = true;
    
    //Validate file availbity 
    if(this.M3SPFileObject == null){
      this.toastr.warning("", "M3 Shipment Status is missing!"); 
    }

    //  STEP1 - Read file
    const M3SPFileJson = await this.readExcelFile(this.M3SPFileObject, M3SPKEYS);
    const finalM3SPFileData = []

    //  STEP2 - Manupilate unique keys
    for (const row of M3SPFileJson) {
      const M3SPUniqueKey =
        this.formatToString(row["CustomerStyleNumber"]).trim().split("/")[0] + "-" +
        this.formatToString(row["Color"]).trim().split("-")[1] + "-" +
        this.formatToString(row["Size"]).trim() + "-" +
        this.mapShipToandDestination(this.formatToString(row["Destination"]).trim())

        console.log(M3SPUniqueKey);
      row["M3SPKey"] = M3SPUniqueKey;

      finalM3SPFileData.push(row);
    }

    //  STEP3 - Delete existing table in indexedDB & insert data to IndexedDB
    const dbInserResponse = await this.DbconService.addBulk("m3sp", finalM3SPFileData);
    
    //STEP4 - Success toast
    this.toastr.success("", "M3 Shipment Status is successfully uploaded!"); 
    
    //  END OF METHOD
    this.isOBProcessing = false;
  }

  // on Compare OOR
  async onCompareAASFile2() {
    this.isOORProcessing = true;

    //Validate file availbity 
    if(this.AASFileObject == null){
      this.toastr.warning("", "AA Sheet is missing!"); 
    }

    //  STEP1 - Read file
    const AASFileJson = await this.readExcelFile(this.AASFileObject, AASKEYS);
    const formattedAASFileData = [];

    //  STEP2 - Manupilate unique key
    for (const row of AASFileJson) {
      const AASUniqueKey =
      this.formatToString(row["GlobalStyle"]).trim() + "-" +
      this.formatToString(row["Color"]).trim() + "-" +
      this.mapSizeandSize(this.formatToString(row["Size"]).trim()) + "-" +
      this.formatToString(row["Destination"]);

      row["AASKey1"] = AASUniqueKey;

      formattedAASFileData.push(row);
    }

    // NOTE: NO need to insert to db as data is processiong on clientSide
    // STEP - Delete existing table in indexedDB & insert data to IndexedDB

    //Need to insert data in the client side to the download funtion
    const dbInserResponse = await this.DbconService.addBulk("aas", formattedAASFileData);

    // STEP3 - process OOR data and find matching OB data row on indexedDB
    const OORMatchedOBRows = [];
    for (const row of formattedAASFileData) {
      const OBMatchedRow = await this.DbconService.getByIndex(
        "m3sp",
        "M3SPKey",
        row.AASKey1
        );
        console.log("OBMatchedRow" + OBMatchedRow);
        console.log(row);
        // STEP3.1 - manupilate JSON objet for compare model
      let compositeKey, CustomerStyle, Destination, Color, PForLF, FOBPricePerPiece, Size, ForRF;
      if (OBMatchedRow) {
        compositeKey = row.AASKey1,
        CustomerStyle = OBMatchedRow.CustomerStyleNumber,
        Color = OBMatchedRow.Color,
        Destination = OBMatchedRow.Destination,
        PForLF = OBMatchedRow.ProdFac_LeadFactory,
        FOBPricePerPiece = OBMatchedRow.FOBPricePerPiece,
        Size = OBMatchedRow.Size,
        ForRF = this.mapAvailability(row.RevisedFactory, row.Factory)
      }else{
        compositeKey = row.AASKey1,
        CustomerStyle = "",
        Color = "",
        FOBPricePerPiece = "",
        Size = "",
        Destination = ""
      }
      OORMatchedOBRows.push({
        compositeKey: compositeKey,
        // OB FILE Fields
        CustomerStyle: CustomerStyle,
        Color: Color,
        Destination: Destination,
        PForLF: PForLF,
        PForLFComp: this.mapM3FactoryandProdFactory(PForLF),
        FOBPPP: FOBPricePerPiece,
        SizeM3: Size,
        // OOR FILE Fields
        GlobalStyle: row.GlobalStyle,
        ForRF: this.mapAvailability(row.RevisedFactory, row.Factory),
        ColorCode: row.Color,
        DestinationComp: row.Destination,
        Size: row.Size,
        SizeComp: this.mapSizeandSize(Size),
        // SizeComp: this.mapSizeandSize(row.Size),
        FOBorRFOB: this.mapAvailability(row.RevisedFOB, row.FOBPrice),
        NRF: row.NRF,
        NRFComp: Color.split("-")[2],
      });
    }

    //STEP4 - success message toast
    this.toastr.success("", "M3 Shipment Status successfully uploaded!"); 
    // STEP5 - Trigger data comparison model
    this.OORComparisionModel3.openModel(OORMatchedOBRows);

    //  END OF METHOD
    this.isOORProcessing = false; // REVISIT
  }




  // Development Testing - RavinduJ - Ends ---------------------------------------------------------------------------------------------------------

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

  ExcelDateToJSDate(date) {
    return new Date(Math.round((date - 25569)*86400*1000));
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

  // AAS and PVHSS mapping - Starts ------------------------------------------------------------------------------------------------

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

getPreviousMonday(value) {
  var date = new Date(value);
    var day = date.getDay();
    var prevMonday = new Date();
    if(date.getDay() == 0){
        prevMonday.setDate(date.getDate() - 7);
    }
    else{
        prevMonday.setDate(date.getDate() - (day-1));
    }

    return this.formatDate(prevMonday);
}
// setToMonday(new Date());

addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() - days);
  return this.convert(result);
}

convert(str) {
  var date = new Date(str),
    mnth = ("0" + (date.getMonth() + 1)).slice(-2),
    day = ("0" + date.getDate()).slice(-2);
  return [date.getFullYear(), mnth, day].join("-");
}

mapAvailability(value1, value2){
  if(value1){
    return value1;
  }else{
    return value2;
  }
}

mapAPLOBColorCodeNRF(Destination, PO, ColorName){
    if(Destination == 'NETHGA' || Destination == 'KOR' || Destination == 'JP04' || Destination == 'JPRTL'
    || Destination == 'PRC' || Destination == 'AHK' || Destination == 'IND02' || Destination == 'NETHOU' 
    || Destination == 'IND03' || Destination == 'JP01' || Destination == 'NETH' || Destination == 'TW01'
    || Destination == 'KRI01' || Destination == 'PAN01' || Destination == 'PRC01' || Destination == 'JP05' 
    || Destination == 'IND01' || Destination == 'CHN01' || Destination == 'TWN01' ){
      return ColorName.split("-").reverse()[1]; 
    }
    if(Destination == 'PA02' || Destination == 'CAN001' || Destination == 'MEX001' || Destination == 'USA002'
    || Destination == 'USA001' || Destination == 'MEX01' || Destination == 'AUS' || Destination == 'BRZ1' 
    || Destination == 'USA02' || Destination == 'BRAZIL' || Destination == 'CAN02' || Destination == 'MEXICO'){
      return ColorName.split("-").reverse()[0];
    }
    if(this.formatSubString(PO,4) == '4300'){
      return ColorName.split("-").reverse()[0];
    }
}

mapPVHSSColorCodeNRF(Country, PO, ColorCode, NRF){
  if(Country == 'INDIA' || Country == 'NETHERLANDS' || Country == 'CHINA' || Country == 'KOREA'
  || Country == 'HONG KONG' || Country == 'JAPAN'){
    return ColorCode; 
  }
  if(Country == 'AUSTRALIA' || Country == 'CANADA' || Country == 'UNITED STATES' || Country == 'PANAMA'
  || Country == 'MAXICO' || Country == 'BRAZIL'){
    return NRF;
  }
  if(this.formatSubString(PO,4) == '4300'){
    return ColorCode;
  }
}


mapFactoryandMemberName(value){

  if(value.includes("10680") || value.includes("Brandix Apparel Solutions Limited - Avissawella") || value.includes("Avissawella")){
    return "Brandix Apparel Solutions Limited - Avissawella"
  }
}

mapM3FactoryandProdFactory(value){
  switch(value){
    case "N09":
      return "BFF";
    case "N27":
      return "BFF";
    default:
      return value;
  }
}

mapSeasonPVH(value){
  switch(value){
    case "Fall":
      return "FA23";
    case "Spring":
      return "SP23";
    case "Basic":
      return "SP23";
    default:
      return value;
  }
}

mapShipToandDestination(value){
  switch(value){
    case "NETHGA":
      return "Europe";
    case "USA002":
      return "US Retail";
    case "MEX001":
      return "Mexico";
    case "USA001":
      return "Us Wholsale";
    case "CAN001":
      return "CA Wholesale/CA Retail";
    case "PA02":
      return "Panama";
    case "AUS":
      return "Australia";
    case "MEX01":
      return "Mexico";
    case "IND02":
      return "India";
    case "AHK":
      return "HK";
    case "PRC":
      return "China";
    case "JPRTL":
      return "Japan";
    case "KOR":
      return "Korea";
    case "TW01":
      return "TBA";
    case "JP01":
      return "Japan";
    case "IND03":
      return "India";
    case "KRI01":
      return "Korea";
    case "BRZ1":
      return "TBA";
    case "NETHOU":
      return "Europe";
    case "PRC01":
      return "China";
    case "JP05":
      return "Japan";
    case "BRAZIL":
      return "TBA";
    case "CAN02":
      return "TBA";
    case "MEXICO":
      return "Mexico";
    case "USA02":
      return "TBA";
    case "IND01":
      return "India";
    case "CHN01":
      return "China";
    case "PA01":
      return "Panama";
    case "AUS02":
      return "Australia";
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

//need to complete
mapCountryandDestination(value){
  switch(value){
    case "NETHGA":
      return "NETHERLANDS";
    case "USA002":
      return "UNITED STATES";
    case "MEX001":
      return "MEXICO";
    case "USA001":
      return "UNITED STATES";
    case "CAN001":
      return "CANADA";
    case "PA02":
      return "PANAMA";
    case "AUS":
      return "AUSTRALIA";
    case "MEX01":
      return "MEXICO";
    case "IND02":
      return "INDIA";
    case "AHK":
      return "HONG KONG";
    case "PRC":
      return "CHINA";
    case "JPRTL":
      return "JAPAN";
    case "KOR":
      return "KOREA";
    case "JP01":
      return "JAPAN";
    case "IND03":
      return "INDIA";
    case "KRI01":
      return "KOREA";
    case "PRC01":
      return "CHINA";
    case "JP05":
      return "JAPAN";
    case "CAN02":
      return "CANADA";
    case "MEXICO":
      return "MEXICO";
    case "USA02":
      return "UNITED STATES";
    case "IND01":
      return "CHINA";
    case "PA01":
      return "PANAMA";
    case "AUS02":
      return "AUSTRALIA";
    case "Test":
      return "Test";
    default:
      return value;
  }
}

mapDeliveryTerm(value){
  if(this.formatToString(value).includes("FCA")){
    return "FCA";
  }
  else if(this.formatToString(value).includes("FOB")){
    return "FOB";
  }
  else{
    return value;
  }
}
//need to complete
mapLineShipMethodandShipmentMode(value){
  switch(value){
    case "ARP":
      return "AIR";
    case "ARC":
      return "AIR";
    case "SEA":
      return "OCEAN";
    case "CRP":
      return "Private Parcel Pervice";
    case "CRC":
      return "Private Parcel Pervice"; 
    default:
      return value;
  }
}

mapOrderTypeandCPO(value){

  if(this.formatToString(value).includes("Ecom") || this.formatToString(value).includes("ECOM") ) {
    return "ECOM";
  }else{
    return "PRD";
  }
}

  //Get OLR custsizedesc code 
  getOLR_CUSTSIZEDESC(custSize){
    if(custSize.includes('Ecom') || custSize.includes('ECOM')){
      return "ECOM";
    }else if(custSize.includes('Long') || custSize.includes('L')){
      return "Long";
    }else{
      return "Reg"
    }
  } 

mapPOSourceandZOption(value){
  switch(this.formatToString(value).slice(-3)){
    case "USR":
      return "Retail";
    case "CNR":
      return "Retail";
    case "USW":
      return "Wholesale";
    case "CNW":
      return "Wholesale";
    default:
      return value;
  }
}

mapFactoryandMemberNameM3(value){
  switch(value){
    case "BFF":
      return "N09";
    // remove test
    case "Test":
      return "Test";
    default:
      return value;
  }
}

mapSizeandSize(value){
  if(value == "2XL") {
    return "2XL";
  }else if(value == "2XS"){
    return "2XS";
  }else if(value == "LG" || value == "L"){
    return "L";
  }else if(value == "MD" || value == "M"){
    return "M";
  }else if(value == "SM" || value == "S"){
    return "S";
  }else if(value == "XL"){
    return "XL";
  }else if(value == "XS"){
    return "XS"
  }else if(value == "XXL" || value == "2XL"){
    return "XXL";
  }else if(value == "2XS"){
    return "XXL";
  }else{
    return value;
  }
  }
}



  // AAS and PVHSS mapping - Ends ------------------------------------------------------------------------------------------------

