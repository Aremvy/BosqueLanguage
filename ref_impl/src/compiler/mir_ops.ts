//-------------------------------------------------------------------------------------------------------
// Copyright (C) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.txt file in the project root for full license information.
//-------------------------------------------------------------------------------------------------------

import { SourceInfo } from "../ast/parser";

type MIRTypeKey = string; //ns::name#binds
type MIRGlobalKey = string; //ns::global
type MIRConstKey = string; //ns::name::const#binds
type MIRFieldKey = string; //ns::name::field#binds
type MIRLambdaKey = string; //enclosingkey$line$column#binds
type MIRFunctionKey = string; //ns::func#binds
type MIRStaticKey = string; //ns::name::static#binds
type MIRMethodKey = string; //ns::name::method#binds

type MIRResolvedTypeKey = string; //idstr
type MIRVirtualMethodKey = string; //method#binds

abstract class MIRArgument {
    readonly nameID: string;

    constructor(nameID: string) {
        this.nameID = nameID;
    }

    abstract stringify(): string;
}

abstract class MIRRegisterArgument extends MIRArgument {
    constructor(nameID: string) {
        super(nameID);
    }

    stringify(): string {
        return this.nameID;
    }
}

class MIRTempRegister extends MIRRegisterArgument {
    readonly regID: number;
    constructor(regID: number) {
        super(`#tmp_${regID}`);
        this.regID = regID;
    }
}

class MIRVarCaptured extends MIRRegisterArgument {
    constructor(name: string) {
        super(name);
    }
}

class MIRVarParameter extends MIRRegisterArgument {
    constructor(name: string) {
        super(name);
    }
}

class MIRVarLocal extends MIRRegisterArgument {
    constructor(name: string) {
        super(name);
    }
}

abstract class MIRConstantArgument extends MIRArgument {
    constructor(name: string) {
        super(name);
    }
}

class MIRConstantNone extends MIRConstantArgument {
    constructor() {
        super("=none=");
    }

    stringify(): string {
        return "none";
    }
}

class MIRConstantTrue extends MIRConstantArgument {
    constructor() {
        super("=true=");
    }

    stringify(): string {
        return "true";
    }
}

class MIRConstantFalse extends MIRConstantArgument {
    constructor() {
        super("=false=");
    }

    stringify(): string {
        return "false";
    }
}

class MIRConstantInt extends MIRConstantArgument {
    readonly value: string;

    constructor(value: string) {
        super(`=int=${value}`);

        this.value = value;
    }

    stringify(): string {
        return this.value;
    }
}

class MIRConstantString extends MIRConstantArgument {
    readonly value: string;

    constructor(value: string) {
        super(`=string=${value}`);

        this.value = value;
    }

    stringify(): string {
        return this.value;
    }
}

//
//TODO: constant typed string and enum here for copy prop etc.
//

enum MIROpTag {
    LoadConst = "LoadConst",
    LoadConstTypedString = "LoadConstTypedString",

    AccessNamespaceConstant = "AccessNamespaceConstant",
    AccessConstField = " AccessConstField",
    LoadFieldDefaultValue = "LoadFieldDefaultValue",
    AccessCapturedVariable = "AccessCapturedVariable",
    AccessArgVariable = "AccessArgVariable",
    AccessLocalVariable = "AccessLocalVariable",

    ConstructorPrimary = "ConstructorPrimary",
    ConstructorPrimaryCollectionEmpty = "ConstructorPrimaryCollectionEmpty",
    ConstructorPrimaryCollectionSingletons = "ConstructorPrimaryCollectionSingletons",
    ConstructorPrimaryCollectionCopies = "ConstructorPrimaryCollectionCopies",
    ConstructorPrimaryCollectionMixed = "ConstructorPrimaryCollectionMixed",
    ConstructorTuple = "ConstructorTuple",
    ConstructorRecord = "ConstructorRecord",
    ConstructorLambda = "ConstructorLambda",

    CallNamespaceFunction = "CallNamespaceFunction",
    CallStaticFunction = "CallStaticFunction",

    MIRAccessFromIndex = "MIRAccessFromIndex",
    MIRProjectFromIndecies = "MIRProjectFromIndecies",
    MIRAccessFromProperty = "MIRAccessFromProperty",
    MIRProjectFromProperties = "MIRProjectFromProperties",
    MIRAccessFromField = "MIRAccessFromField",
    MIRProjectFromFields = "MIRProjectFromFields",
    MIRProjectFromTypeTuple = "MIRProjectFromTypeTuple",
    MIRProjectFromTypeRecord = "MIRProjectFromTypeRecord",
    MIRProjectFromTypeConcept = "MIRProjectFromTypeConcept",
    MIRModifyWithIndecies = "MIRModifyWithIndecies",
    MIRModifyWithProperties = "MIRModifyWithProperties",
    MIRModifyWithFields = "MIRModifyWithFields",
    MIRStructuredExtendTuple = "MIRStructuredExtendTuple",
    MIRStructuredExtendRecord = "MIRStructuredExtendRecord",
    MIRStructuredExtendObject = "MIRStructuredExtendObject",
    MIRInvokeKnownTarget = "MIRInvokeKnownTarget",
    MIRInvokeVirtualTarget = "MIRInvokeVirtualTarget",
    MIRCallLambda = "MIRCallLambda",

    MIRPrefixOp = "MIRPrefixOp",

    MIRBinOp = "MIRBinOp",
    MIRBinEq = "MIRBinEq",
    MIRBinCmp = "MIRBinCmp",

    MIRRegAssign = "MIRRegAssign",
    MIRTruthyConvert = "MIRTruthyConvert",
    MIRVarStore = "MIRVarStore",
    MIRReturnAssign = "MIRReturnAssign",

    MIRAssert = "MIRAssert",
    MIRCheck = "MIRCheck",
    MIRDebug = "MIRDebug",

    MIRJump = "MIRJump",
    MIRJumpCond = "MIRJumpCond",
    MIRJumpNone = "MIRJumpNone",

    MIRVarLifetimeStart = "MIRVarLifetimeStart",
    MIRVarLifetimeEnd = "MIRVarLifetimeEnd"
}

abstract class MIROp {
    readonly tag: MIROpTag;
    readonly sinfo: SourceInfo;

    constructor(tag: MIROpTag, sinfo: SourceInfo) {
        this.tag = tag;
        this.sinfo = sinfo;
    }

    abstract getUsed(): MIRArgument[];
    abstract getMod(): MIRArgument[];

    abstract stringify(): string;
}

abstract class MIRValueOp extends MIROp {
    readonly trgt: MIRTempRegister;

    constructor(tag: MIROpTag, sinfo: SourceInfo, trgt: MIRTempRegister) {
        super(tag, sinfo);
        this.trgt = trgt;
    }

    getMod(): MIRArgument[] { return [this.trgt]; }
}

abstract class MIRFlowOp extends MIROp {
    constructor(tag: MIROpTag, sinfo: SourceInfo) {
        super(tag, sinfo);
    }
}

abstract class MIRJumpOp extends MIROp {
    constructor(tag: MIROpTag, sinfo: SourceInfo) {
        super(tag, sinfo);
    }
}

class MIRLoadConst extends MIRValueOp {
    readonly src: MIRConstantArgument;

    constructor(sinfo: SourceInfo, src: MIRConstantArgument, trgt: MIRTempRegister) {
        super(MIROpTag.LoadConst, sinfo, trgt);
        this.src = src;
    }

    getUsed(): MIRArgument[] { return []; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.src.stringify()}`;
    }
}

class MIRLoadConstTypedString extends MIRValueOp {
    readonly ivalue: string;
    readonly tkey: MIRTypeKey;
    readonly tskey: MIRResolvedTypeKey;

    constructor(sinfo: SourceInfo, ivalue: string, tkey: MIRTypeKey, tskey: MIRResolvedTypeKey, trgt: MIRTempRegister) {
        super(MIROpTag.LoadConstTypedString, sinfo, trgt);
        this.ivalue = ivalue;
        this.tkey = tkey;
        this.tskey = tskey;
    }

    getUsed(): MIRArgument[] { return []; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.ivalue}#${this.tkey}`;
    }
}

class MIRAccessNamespaceConstant extends MIRValueOp {
    readonly gkey: MIRGlobalKey;

    constructor(sinfo: SourceInfo, gkey: MIRGlobalKey, trgt: MIRTempRegister) {
        super(MIROpTag.AccessNamespaceConstant, sinfo, trgt);
        this.gkey = gkey;
    }

    getUsed(): MIRArgument[] { return []; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.gkey}`;
    }
}

class MIRAccessConstField extends MIRValueOp {
    readonly ckey: MIRConstKey;

    constructor(sinfo: SourceInfo, ckey: MIRConstKey, trgt: MIRTempRegister) {
        super(MIROpTag.AccessConstField, sinfo, trgt);
        this.ckey = ckey;
    }

    getUsed(): MIRArgument[] { return []; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.ckey}`;
    }
}

class MIRLoadFieldDefaultValue extends MIRValueOp {
    readonly fkey: MIRFieldKey;

    constructor(sinfo: SourceInfo, fkey: MIRFieldKey, trgt: MIRTempRegister) {
        super(MIROpTag.LoadFieldDefaultValue, sinfo, trgt);
        this.fkey = fkey;
    }

    getUsed(): MIRArgument[] { return []; }

    stringify(): string {
        return `${this.trgt.stringify()} = default(${this.fkey})`;
    }
}

class MIRAccessCapturedVariable extends MIRValueOp {
    readonly name: string;

    constructor(sinfo: SourceInfo, name: string, trgt: MIRTempRegister) {
        super(MIROpTag.AccessCapturedVariable, sinfo, trgt);
        this.name = name;
    }

    getUsed(): MIRArgument[] { return [new MIRVarCaptured(this.name)]; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.name}`;
    }
}

class MIRAccessArgVariable extends MIRValueOp {
    readonly name: string;

    constructor(sinfo: SourceInfo, name: string, trgt: MIRTempRegister) {
        super(MIROpTag.AccessArgVariable, sinfo, trgt);
        this.name = name;
    }

    getUsed(): MIRArgument[] { return [new MIRVarParameter(this.name)]; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.name}`;
    }
}

class MIRAccessLocalVariable extends MIRValueOp {
    readonly name: string;

    constructor(sinfo: SourceInfo, name: string, trgt: MIRTempRegister) {
        super(MIROpTag.AccessLocalVariable, sinfo, trgt);
        this.name = name;
    }

    getUsed(): MIRArgument[] { return [new MIRVarLocal(this.name)]; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.name}`;
    }
}

class MIRConstructorPrimary extends MIRValueOp {
    readonly tkey: MIRTypeKey;
    args: MIRArgument[];

    constructor(sinfo: SourceInfo, tkey: MIRTypeKey, args: MIRArgument[], trgt: MIRTempRegister) {
        super(MIROpTag.ConstructorPrimary, sinfo, trgt);
        this.tkey = tkey;
        this.args = args;
    }

    getUsed(): MIRArgument[] { return [...this.args]; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.tkey}@(${this.args.map((arg) => arg.stringify()).join(", ")})`;
    }
}

class MIRConstructorPrimaryCollectionEmpty extends MIRValueOp {
    readonly tkey: MIRTypeKey;

    constructor(sinfo: SourceInfo, tkey: MIRTypeKey, trgt: MIRTempRegister) {
        super(MIROpTag.ConstructorPrimaryCollectionEmpty, sinfo, trgt);
        this.tkey = tkey;
    }

    getUsed(): MIRArgument[] { return []; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.tkey}@{}`;
    }
}

class MIRConstructorPrimaryCollectionSingletons extends MIRValueOp {
    readonly tkey: MIRTypeKey;
    args: MIRArgument[];

    constructor(sinfo: SourceInfo, tkey: MIRTypeKey, args: MIRArgument[], trgt: MIRTempRegister) {
        super(MIROpTag.ConstructorPrimaryCollectionSingletons, sinfo, trgt);
        this.tkey = tkey;
        this.args = args;
    }

    getUsed(): MIRArgument[] { return [...this.args]; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.tkey}@{${this.args.map((arg) => arg.stringify()).join(", ")}}`;
    }
}

class MIRConstructorPrimaryCollectionCopies extends MIRValueOp {
    readonly tkey: MIRTypeKey;
    args: MIRArgument[];

    constructor(sinfo: SourceInfo, tkey: MIRTypeKey, args: MIRArgument[], trgt: MIRTempRegister) {
        super(MIROpTag.ConstructorPrimaryCollectionCopies, sinfo, trgt);
        this.tkey = tkey;
        this.args = args;
    }

    getUsed(): MIRArgument[] { return [...this.args]; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.tkey}@{${this.args.map((arg) => `expand(${arg.stringify()})`).join(", ")}`;
    }
}

class MIRConstructorPrimaryCollectionMixed extends MIRValueOp {
    readonly tkey: MIRTypeKey;
    args: [boolean, MIRArgument][];

    constructor(sinfo: SourceInfo, tkey: MIRTypeKey, args: [boolean, MIRArgument][], trgt: MIRTempRegister) {
        super(MIROpTag.ConstructorPrimaryCollectionMixed, sinfo, trgt);
        this.tkey = tkey;
        this.args = args;
    }

    getUsed(): MIRArgument[] { return this.args.map((tv) => tv[1]); }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.tkey}@{${this.args.map((arg) => arg[0] ? `expand(${arg[1].stringify()})` : arg[1].stringify()).join(", ")}`;
    }
}

class MIRConstructorTuple extends MIRValueOp {
    args: MIRArgument[];

    constructor(sinfo: SourceInfo, args: MIRArgument[], trgt: MIRTempRegister) {
        super(MIROpTag.ConstructorTuple, sinfo, trgt);
        this.args = args;
    }

    getUsed(): MIRArgument[] { return [...this.args]; }

    stringify(): string {
        return `${this.trgt.stringify()} = @[${this.args.map((arg) => arg.stringify()).join(", ")}]`;
    }
}

class MIRConstructorRecord extends MIRValueOp {
    args: [string, MIRArgument][];

    constructor(sinfo: SourceInfo, args: [string, MIRArgument][], trgt: MIRTempRegister) {
        super(MIROpTag.ConstructorRecord, sinfo, trgt);
        this.args = args;
    }

    getUsed(): MIRArgument[] { return this.args.map((tv) => tv[1]); }

    stringify(): string {
        return `${this.trgt.stringify()} = @{${this.args.map((arg) => `${arg[0]}=${arg[1].stringify()}`).join(", ")}}`;
    }
}

class MIRConstructorLambda extends MIRValueOp {
    readonly lkey: MIRLambdaKey;
    readonly lsigkey: MIRResolvedTypeKey;
    readonly captured: string[];

    constructor(sinfo: SourceInfo, lkey: MIRLambdaKey, lsigkey: MIRResolvedTypeKey, captured: string[], trgt: MIRTempRegister) {
        super(MIROpTag.ConstructorLambda, sinfo, trgt);
        this.lkey = lkey;
        this.lsigkey = lsigkey;
        this.captured = captured;
    }

    getUsed(): MIRArgument[] { return this.captured.map((cv) => new MIRVarCaptured(cv)); }

    stringify(): string {
        return `${this.trgt.stringify()} = fn(${this.lkey})`;
    }
}

class MIRCallNamespaceFunction extends MIRValueOp {
    readonly fkey: MIRFunctionKey;
    args: MIRArgument[];

    constructor(sinfo: SourceInfo, fkey: MIRFunctionKey, args: MIRArgument[], trgt: MIRTempRegister) {
        super(MIROpTag.CallNamespaceFunction, sinfo, trgt);
        this.fkey = fkey;
        this.args = args;
    }

    getUsed(): MIRArgument[] { return [...this.args]; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.fkey}(${this.args.map((arg) => arg.stringify()).join(", ")})`;
    }
}

class MIRCallStaticFunction extends MIRValueOp {
    readonly skey: MIRStaticKey;
    args: MIRArgument[];

    constructor(sinfo: SourceInfo, skey: MIRStaticKey, args: MIRArgument[], trgt: MIRTempRegister) {
        super(MIROpTag.CallStaticFunction, sinfo, trgt);
        this.skey = skey;
        this.args = args;
    }

    getUsed(): MIRArgument[] { return [...this.args]; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.skey}(${this.args.map((arg) => arg.stringify()).join(", ")})`;
    }
}

class MIRAccessFromIndex extends MIRValueOp {
    arg: MIRArgument;
    readonly idx: number;

    constructor(sinfo: SourceInfo, arg: MIRArgument, idx: number, trgt: MIRTempRegister) {
        super(MIROpTag.MIRAccessFromIndex, sinfo, trgt);
        this.arg = arg;
        this.idx = idx;
    }

    getUsed(): MIRArgument[] { return [this.arg]; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.arg.stringify()}[${this.idx}]`;
    }
}

class MIRProjectFromIndecies extends MIRValueOp {
    arg: MIRArgument;
    readonly indecies: number[];

    constructor(sinfo: SourceInfo, arg: MIRArgument, indecies: number[], trgt: MIRTempRegister) {
        super(MIROpTag.MIRProjectFromIndecies, sinfo, trgt);
        this.arg = arg;
        this.indecies = indecies;
    }

    getUsed(): MIRArgument[] { return [this.arg]; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.arg.stringify()}@[${this.indecies.map((i) => i.toString()).join(", ")}]`;
    }
}

class MIRAccessFromProperty extends MIRValueOp {
    arg: MIRArgument;
    readonly property: string;

    constructor(sinfo: SourceInfo, arg: MIRArgument, property: string, trgt: MIRTempRegister) {
        super(MIROpTag.MIRAccessFromProperty, sinfo, trgt);
        this.arg = arg;
        this.property = property;
    }

    getUsed(): MIRArgument[] { return [this.arg]; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.arg.stringify()}.${this.property}`;
    }
}

class MIRProjectFromProperties extends MIRValueOp {
    arg: MIRArgument;
    readonly properties: string[];

    constructor(sinfo: SourceInfo, arg: MIRArgument, properties: string[], trgt: MIRTempRegister) {
        super(MIROpTag.MIRProjectFromProperties, sinfo, trgt);
        this.arg = arg;
        this.properties = properties;
    }

    getUsed(): MIRArgument[] { return [this.arg]; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.arg.stringify()}@{${this.properties.join(", ")}}`;
    }
}

class MIRAccessFromField extends MIRValueOp {
    arg: MIRArgument;
    readonly field: string;

    constructor(sinfo: SourceInfo, arg: MIRArgument, field: string, trgt: MIRTempRegister) {
        super(MIROpTag.MIRAccessFromField, sinfo, trgt);
        this.arg = arg;
        this.field = field;
    }

    getUsed(): MIRArgument[] { return [this.arg]; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.arg.stringify()}.${this.field}`;
    }
}

class MIRProjectFromFields extends MIRValueOp {
    arg: MIRArgument;
    readonly fields: string[];

    constructor(sinfo: SourceInfo, arg: MIRArgument, fields: string[], trgt: MIRTempRegister) {
        super(MIROpTag.MIRProjectFromFields, sinfo, trgt);
        this.arg = arg;
        this.fields = fields;
    }

    getUsed(): MIRArgument[] { return [this.arg]; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.arg.stringify()}@{${this.fields.join(", ")}}`;
    }
}

class MIRProjectFromTypeTuple extends MIRValueOp {
    arg: MIRArgument;
    readonly ptype: MIRResolvedTypeKey;

    constructor(sinfo: SourceInfo, arg: MIRArgument, ptype: MIRResolvedTypeKey, trgt: MIRTempRegister) {
        super(MIROpTag.MIRProjectFromTypeTuple, sinfo, trgt);
        this.arg = arg;
        this.ptype = ptype;
    }

    getUsed(): MIRArgument[] { return [this.arg]; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.arg.stringify()}#${this.ptype}`;
    }
}

class MIRProjectFromTypeRecord extends MIRValueOp {
    arg: MIRArgument;
    readonly ptype: MIRResolvedTypeKey;

    constructor(sinfo: SourceInfo, arg: MIRArgument, ptype: MIRResolvedTypeKey, trgt: MIRTempRegister) {
        super(MIROpTag.MIRProjectFromTypeRecord, sinfo, trgt);
        this.arg = arg;
        this.ptype = ptype;
    }

    getUsed(): MIRArgument[] { return [this.arg]; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.arg.stringify()}#${this.ptype}`;
    }
}

class MIRProjectFromTypeConcept extends MIRValueOp {
    arg: MIRArgument;
    readonly ctypes: MIRTypeKey[];

    constructor(sinfo: SourceInfo, arg: MIRArgument, ctypes: MIRTypeKey[], trgt: MIRTempRegister) {
        super(MIROpTag.MIRProjectFromTypeConcept, sinfo, trgt);
        this.arg = arg;
        this.ctypes = ctypes;
    }

    getUsed(): MIRArgument[] { return [this.arg]; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.arg.stringify()}#${this.ctypes.join("&")}`;
    }
}

class MIRModifyWithIndecies extends MIRValueOp {
    arg: MIRArgument;
    updates: [number, MIRArgument][];

    constructor(sinfo: SourceInfo, arg: MIRArgument, updates: [number, MIRArgument][], trgt: MIRTempRegister) {
        super(MIROpTag.MIRModifyWithIndecies, sinfo, trgt);
        this.arg = arg;
        this.updates = updates;
    }

    getUsed(): MIRArgument[] { return [this.arg, ...this.updates.map((u) => u[1])]; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.arg.stringify()}<~${this.updates.map((u) => `${u[0]}=${u[1].stringify()}`).join(", ")}]`;
    }
}

class MIRModifyWithProperties extends MIRValueOp {
    arg: MIRArgument;
    updates: [string, MIRArgument][];

    constructor(sinfo: SourceInfo, arg: MIRArgument, updates: [string, MIRArgument][], trgt: MIRTempRegister) {
        super(MIROpTag.MIRModifyWithProperties, sinfo, trgt);
        this.arg = arg;
        this.updates = updates;
    }

    getUsed(): MIRArgument[] { return [this.arg, ...this.updates.map((u) => u[1])]; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.arg.stringify()}<~${this.updates.map((u) => `${u[0]}=${u[1].stringify()}`).join(", ")}]`;
    }
}

class MIRModifyWithFields extends MIRValueOp {
    arg: MIRArgument;
    updates: [string, MIRArgument][];

    constructor(sinfo: SourceInfo, arg: MIRArgument, updates: [string, MIRArgument][], trgt: MIRTempRegister) {
        super(MIROpTag.MIRModifyWithFields, sinfo, trgt);
        this.arg = arg;
        this.updates = updates;
    }

    getUsed(): MIRArgument[] { return [this.arg, ...this.updates.map((u) => u[1])]; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.arg.stringify()}<~${this.updates.map((u) => `${u[0]}=${u[1].stringify()}`).join(", ")}]`;
    }
}

class MIRStructuredExtendTuple extends MIRValueOp {
    arg: MIRArgument;
    update: MIRArgument;

    constructor(sinfo: SourceInfo, arg: MIRArgument, update: MIRArgument, trgt: MIRTempRegister) {
        super(MIROpTag.MIRStructuredExtendTuple, sinfo, trgt);
        this.arg = arg;
        this.update = update;
    }

    getUsed(): MIRArgument[] { return [this.arg, this.update]; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.arg.stringify()}<+(${this.update.stringify()})`;
    }
}

class MIRStructuredExtendRecord extends MIRValueOp {
    arg: MIRArgument;
    update: MIRArgument;

    constructor(sinfo: SourceInfo, arg: MIRArgument, update: MIRArgument, trgt: MIRTempRegister) {
        super(MIROpTag.MIRStructuredExtendRecord, sinfo, trgt);
        this.arg = arg;
        this.update = update;
    }

    getUsed(): MIRArgument[] { return [this.arg, this.update]; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.arg.stringify()}<+(${this.update.stringify()})`;
    }
}

class MIRStructuredExtendObject extends MIRValueOp {
    arg: MIRArgument;
    update: MIRArgument;

    constructor(sinfo: SourceInfo, arg: MIRArgument, update: MIRArgument, trgt: MIRTempRegister) {
        super(MIROpTag.MIRStructuredExtendObject, sinfo, trgt);
        this.arg = arg;
        this.update = update;
    }

    getUsed(): MIRArgument[] { return [this.arg, this.update]; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.arg.stringify()}<+(${this.update.stringify()})`;
    }
}

class MIRInvokeKnownTarget extends MIRValueOp {
    readonly mkey: MIRMethodKey;
    args: MIRArgument[]; //this is args[0]

    constructor(sinfo: SourceInfo, mkey: MIRMethodKey, args: MIRArgument[], trgt: MIRTempRegister) {
        super(MIROpTag.MIRInvokeKnownTarget, sinfo, trgt);
        this.mkey = mkey;
        this.args = args;
    }

    getUsed(): MIRArgument[] { return [...this.args]; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.args[0].stringify()}->::${this.mkey}::(${[...this.args].slice(1).map((arg) => arg.stringify()).join(", ")})`;
    }
}

class MIRInvokeVirtualTarget extends MIRValueOp {
    readonly vresolve: MIRVirtualMethodKey;
    args: MIRArgument[]; //this is args[0]

    constructor(sinfo: SourceInfo, vresolve: MIRVirtualMethodKey, args: MIRArgument[], trgt: MIRTempRegister) {
        super(MIROpTag.MIRInvokeVirtualTarget, sinfo, trgt);
        this.vresolve = vresolve;
        this.args = args;
    }

    getUsed(): MIRArgument[] { return [...this.args]; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.args[0].stringify()}->${this.vresolve}(${[...this.args].slice(1).map((arg) => arg.stringify()).join(", ")})`;
    }
}

class MIRCallLambda extends MIRValueOp {
    lambda: MIRArgument;
    args: MIRArgument[];

    constructor(sinfo: SourceInfo, lambda: MIRArgument, args: MIRArgument[], trgt: MIRTempRegister) {
        super(MIROpTag.MIRCallLambda, sinfo, trgt);
        this.lambda = lambda;
        this.args = args;
    }

    getUsed(): MIRArgument[] { return [this.lambda, ...this.args]; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.lambda.stringify()}(${this.args.map((arg) => arg.stringify()).join(", ")})`;
    }
}

class MIRPrefixOp extends MIRValueOp {
    readonly op: string; //+, -, !
    arg: MIRArgument;

    constructor(sinfo: SourceInfo, op: string, arg: MIRArgument, trgt: MIRTempRegister) {
        super(MIROpTag.MIRPrefixOp, sinfo, trgt);
        this.op = op;
        this.arg = arg;
    }

    getUsed(): MIRArgument[] { return [this.arg]; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.op}${this.arg.stringify()}`;
    }
}

class MIRBinOp extends MIRValueOp {
    lhs: MIRArgument;
    readonly op: string; //+, -, *, /, %
    rhs: MIRArgument;

    constructor(sinfo: SourceInfo, lhs: MIRArgument, op: string, rhs: MIRArgument, trgt: MIRTempRegister) {
        super(MIROpTag.MIRBinOp, sinfo, trgt);
        this.lhs = lhs;
        this.op = op;
        this.rhs = rhs;
    }

    getUsed(): MIRArgument[] { return [this.lhs, this.rhs]; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.lhs.stringify()}${this.op}${this.rhs.stringify()}`;
    }
}

class MIRBinEq extends MIRValueOp {
    lhs: MIRArgument;
    readonly op: string; //==, !=
    rhs: MIRArgument;

    constructor(sinfo: SourceInfo, lhs: MIRArgument, op: string, rhs: MIRArgument, trgt: MIRTempRegister) {
        super(MIROpTag.MIRBinEq, sinfo, trgt);
        this.lhs = lhs;
        this.op = op;
        this.rhs = rhs;
    }

    getUsed(): MIRArgument[] { return [this.lhs, this.rhs]; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.lhs.stringify()}${this.op}${this.rhs.stringify()}`;
    }
}

class MIRBinCmp extends MIRValueOp {
    lhs: MIRArgument;
    readonly op: string; //<, >, <=, >=
    rhs: MIRArgument;

    constructor(sinfo: SourceInfo, lhs: MIRArgument, op: string, rhs: MIRArgument, trgt: MIRTempRegister) {
        super(MIROpTag.MIRBinCmp, sinfo, trgt);
        this.lhs = lhs;
        this.op = op;
        this.rhs = rhs;
    }

    getUsed(): MIRArgument[] { return [this.lhs, this.rhs]; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.lhs.stringify()}${this.op}${this.rhs.stringify()}`;
    }
}

class MIRRegAssign extends MIRFlowOp {
    src: MIRArgument;
    trgt: MIRTempRegister;

    constructor(sinfo: SourceInfo, src: MIRArgument, trgt: MIRTempRegister) {
        super(MIROpTag.MIRRegAssign, sinfo);
        this.src = src;
        this.trgt = trgt;
    }

    getUsed(): MIRArgument[] { return [this.src]; }
    getMod(): MIRArgument[] { return [this.trgt]; }

    stringify(): string {
        return `${this.trgt.stringify()} = ${this.src.stringify()}`;
    }
}

class MIRTruthyConvert extends MIRFlowOp {
    src: MIRArgument;
    trgt: MIRTempRegister;

    constructor(sinfo: SourceInfo, src: MIRArgument, trgt: MIRTempRegister) {
        super(MIROpTag.MIRTruthyConvert, sinfo);
        this.src = src;
        this.trgt = trgt;
    }

    getUsed(): MIRArgument[] { return [this.src]; }
    getMod(): MIRArgument[] { return [this.trgt]; }

    stringify(): string {
        return `${this.trgt.stringify()} = truthy(${this.src.stringify()})`;
    }
}

class MIRVarStore extends MIRFlowOp {
    src: MIRArgument;
    readonly name: string;

    constructor(sinfo: SourceInfo, src: MIRTempRegister, name: string) {
        super(MIROpTag.MIRVarStore, sinfo);
        this.src = src;
        this.name = name;
    }

    getUsed(): MIRArgument[] { return [this.src]; }
    getMod(): MIRArgument[] { return [new MIRVarLocal(this.name)]; }

    stringify(): string {
        return `${this.name} = ${this.src.stringify()}`;
    }
}

class MIRReturnAssign extends MIRFlowOp {
    src: MIRArgument;

    constructor(sinfo: SourceInfo, src: MIRTempRegister) {
        super(MIROpTag.MIRReturnAssign, sinfo);
        this.src = src;
    }

    getUsed(): MIRArgument[] { return [this.src]; }
    getMod(): MIRArgument[] { return []; }

    stringify(): string {
        return `_return_ = ${this.src.stringify()}`;
    }
}

class MIRAssert extends MIRFlowOp {
    cond: MIRArgument;

    constructor(sinfo: SourceInfo, cond: MIRArgument) {
        super(MIROpTag.MIRAssert, sinfo);
        this.cond = cond;
    }

    getUsed(): MIRArgument[] { return [this.cond]; }
    getMod(): MIRArgument[] { return []; }

    stringify(): string {
        return `assert ${this.cond.stringify()}`;
    }
}

class MIRCheck extends MIRFlowOp {
    cond: MIRArgument;

    constructor(sinfo: SourceInfo, cond: MIRArgument) {
        super(MIROpTag.MIRCheck, sinfo);
        this.cond = cond;
    }

    getUsed(): MIRArgument[] { return [this.cond]; }
    getMod(): MIRArgument[] { return []; }

    stringify(): string {
        return `check ${this.cond.stringify()}`;
    }
}

class MIRDebug extends MIRFlowOp {
    value: MIRArgument | undefined;

    constructor(sinfo: SourceInfo, value: MIRArgument | undefined) {
        super(MIROpTag.MIRDebug, sinfo);
        this.value = value;
    }

    getUsed(): MIRArgument[] { return this.value !== undefined ? [this.value] : []; }
    getMod(): MIRArgument[] { return []; }

    stringify(): string {
        if (this.value === undefined) {
            return "_debug break";
        }
        else {
            return `_debug ${this.value.stringify()}`;
        }
    }
}

class MIRJump extends MIRJumpOp {
    readonly trgtblock: string;

    constructor(sinfo: SourceInfo, blck: string) {
        super(MIROpTag.MIRJump, sinfo);
        this.trgtblock = blck;
    }

    getUsed(): MIRArgument[] { return []; }
    getMod(): MIRArgument[] { return []; }

    stringify(): string {
        return `jump ${this.trgtblock}`;
    }
}

class MIRVarLifetimeStart extends MIRJumpOp {
    readonly name: string;
    readonly rtype: MIRResolvedTypeKey;

    constructor(sinfo: SourceInfo, name: string, rtype: MIRResolvedTypeKey) {
        super(MIROpTag.MIRVarLifetimeStart, sinfo);
        this.name = name;
        this.rtype = rtype;
    }

    getUsed(): MIRArgument[] { return []; }
    getMod(): MIRArgument[] { return []; }

    stringify(): string {
        return `v-begin ${this.name}`;
    }
}

class MIRVarLifetimeEnd extends MIRJumpOp {
    readonly name: string;

    constructor(sinfo: SourceInfo, name: string) {
        super(MIROpTag.MIRVarLifetimeEnd, sinfo);
        this.name = name;
    }

    getUsed(): MIRArgument[] { return []; }
    getMod(): MIRArgument[] { return []; }

    stringify(): string {
        return `v-end ${this.name}`;
    }
}

class MIRJumpCond extends MIRJumpOp {
    arg: MIRArgument;
    readonly trueblock: string;
    readonly falseblock: string;

    constructor(sinfo: SourceInfo, arg: MIRArgument, trueblck: string, falseblck: string) {
        super(MIROpTag.MIRJumpCond, sinfo);
        this.arg = arg;
        this.trueblock = trueblck;
        this.falseblock = falseblck;
    }

    getUsed(): MIRArgument[] { return [this.arg]; }
    getMod(): MIRArgument[] { return []; }

    stringify(): string {
        return `cjump ${this.arg.stringify()} ${this.trueblock} ${this.falseblock}`;
    }
}

class MIRJumpNone extends MIRJumpOp {
    arg: MIRArgument;
    readonly noneblock: string;
    readonly someblock: string;

    constructor(sinfo: SourceInfo, arg: MIRArgument, noneblck: string, someblck: string) {
        super(MIROpTag.MIRJumpNone, sinfo);
        this.arg = arg;
        this.noneblock = noneblck;
        this.someblock = someblck;
    }

    getUsed(): MIRArgument[] { return [this.arg]; }
    getMod(): MIRArgument[] { return []; }

    stringify(): string {
        return `njump ${this.arg.stringify()} ${this.noneblock} ${this.someblock}`;
    }
}

class MIRBasicBlock {
    readonly label: string;
    ops: MIROp[];

    constructor(label: string, ops: MIROp[]) {
        this.label = label;
        this.ops = ops;
    }

    jsonify(): any {
        const jblck = {
            label: this.label,
            line: (this.ops.length !== 0) ? this.ops[0].sinfo.line : -1,
            ops: this.ops.map((op) => op.stringify())
        };

        return jblck;
    }
}

class MIRBody {
    readonly file: string;
    readonly sinfo: SourceInfo;

    readonly varNames: Set<string>;
    body: string | Map<string, MIRBasicBlock>;

    constructor(file: string, sinfo: SourceInfo, varNames: Set<string>, body: string | Map<string, MIRBasicBlock>) {
        this.file = file;
        this.sinfo = sinfo;
        this.varNames = varNames;
        this.body = body;
    }

    jsonify(): any {
        if (typeof (this.body) === "string") {
            return this.body;
        }
        else {
            let blocks: string[] = [];
            this.body.forEach((v, k) => blocks.push(v.jsonify()));

            return blocks;
        }
    }
}

export {
    MIRTypeKey, MIRGlobalKey, MIRConstKey, MIRFieldKey, MIRLambdaKey, MIRFunctionKey, MIRStaticKey, MIRMethodKey, MIRResolvedTypeKey, MIRVirtualMethodKey,
    MIRArgument, MIRRegisterArgument, MIRTempRegister, MIRVarCaptured, MIRVarParameter, MIRVarLocal, MIRConstantArgument, MIRConstantNone, MIRConstantTrue, MIRConstantFalse, MIRConstantInt, MIRConstantString,
    MIROpTag, MIROp, MIRValueOp, MIRFlowOp, MIRJumpOp,
    MIRLoadConst, MIRLoadConstTypedString,
    MIRAccessNamespaceConstant, MIRAccessConstField, MIRLoadFieldDefaultValue, MIRAccessCapturedVariable, MIRAccessArgVariable, MIRAccessLocalVariable,
    MIRConstructorPrimary, MIRConstructorPrimaryCollectionEmpty, MIRConstructorPrimaryCollectionSingletons, MIRConstructorPrimaryCollectionCopies, MIRConstructorPrimaryCollectionMixed, MIRConstructorTuple, MIRConstructorRecord, MIRConstructorLambda,
    MIRCallNamespaceFunction, MIRCallStaticFunction,
    MIRAccessFromIndex, MIRProjectFromIndecies, MIRAccessFromProperty, MIRProjectFromProperties, MIRAccessFromField, MIRProjectFromFields, MIRProjectFromTypeTuple, MIRProjectFromTypeRecord, MIRProjectFromTypeConcept, MIRModifyWithIndecies, MIRModifyWithProperties, MIRModifyWithFields, MIRStructuredExtendTuple, MIRStructuredExtendRecord, MIRStructuredExtendObject, MIRInvokeKnownTarget, MIRInvokeVirtualTarget, MIRCallLambda,
    MIRPrefixOp, MIRBinOp, MIRBinEq, MIRBinCmp,
    MIRRegAssign, MIRTruthyConvert, MIRVarStore, MIRReturnAssign,
    MIRAssert, MIRCheck, MIRDebug,
    MIRJump, MIRJumpCond, MIRJumpNone,
    MIRVarLifetimeStart, MIRVarLifetimeEnd,
    MIRBasicBlock, MIRBody
};
