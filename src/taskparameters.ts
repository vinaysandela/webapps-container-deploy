import * as core from '@actions/core';

import { AzureResourceFilterUtility } from "azure-actions-appservice-rest/Utilities/AzureResourceFilterUtility";
import { IAuthorizer } from "azure-actions-webclient/Authorizer/IAuthorizer";

import fs = require('fs');

export class TaskParameters {
    private static taskparams: TaskParameters;
    private _appName: string;
    private _images: string;
    private _resourceGroupName?: string;
    private _multiContainerConfigFile?: string;
    private _endpoint: IAuthorizer;
    private _containerCommand: string;
    private _kind: string;
    private _isLinux: boolean;
    private _isMultiContainer: boolean;
    private _slotName: string;

    private constructor(endpoint: IAuthorizer) {
        this._appName = core.getInput('app-name', { required: true });
        this._slotName = core.getInput('slot-name');
        this._images = core.getInput('images');
        this._multiContainerConfigFile = core.getInput('configuration-file');
        this._containerCommand = core.getInput('container-command');
        this._endpoint = endpoint;
        this.checkContainerType();
    }

    public static getTaskParams(endpoint: IAuthorizer) {
        if(!this.taskparams) {
            this.taskparams = new TaskParameters(endpoint);
        }
        return this.taskparams;
    }

    public get appName() {
        return this._appName;
    }

    public get slotName(){
        return this._slotName;
    }

    public get images() {
        return this._images;
    }

    public get resourceGroupName() {
        return this._resourceGroupName;
    }

    public get endpoint() {
        return this._endpoint;
    }

    public get isLinux() {
        return this._isLinux;
    }

    public get isMultiContainer() {
        return this._isMultiContainer;
    }

    public get containerCommand() {
        return this._containerCommand;
    }

    public get multiContainerConfigFile() {
        return this._multiContainerConfigFile;
    }

    public async getResourceDetails() {
        let appDetails = await AzureResourceFilterUtility.getAppDetails(this.endpoint, this.appName);
        this._resourceGroupName = appDetails["resourceGroupName"];
        this._kind = appDetails["kind"];
        this._isLinux = this._kind.indexOf('linux') >= 0;
    }

    private checkContainerType(){
        let images = this._images.split("\n");
        this._isMultiContainer = false;
        if(!!this._multiContainerConfigFile && exist(this._multiContainerConfigFile)){            
            let stats: fs.Stats = fs.statSync(this._multiContainerConfigFile);
            if(!stats.isFile()) {
                throw new Error("Docker-compose file path is incorrect.");
            }
            else {
                this._isMultiContainer = true;
                core.debug("Is multi-container app");
            }

            if(!!this._images){
                console.log("Multi-container deployment with the transformation of Docker-Compose file.");
            }
            else {
                console.log("Multi-container deployment without transformation of Docker-Compose file.");
            }
        }
        else if(images.length > 1) {
            throw new Error("Multiple images indicate multi-container deployment type, but Docker-compose file is absent.")
        }
    }
}

export function exist(path) {
    var exist = false;
    try {
        exist = path && fs.statSync(path) != null;
    }
    catch (err) {
        if (err && err.code === 'ENOENT') {
            exist = false;
        }
        else {
            throw err;
        }
    }
    return exist;
}