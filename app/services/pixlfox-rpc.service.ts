import { Injectable } from '@angular/core';
import { PixlFoxClientService } from "./pixlfox.service";
import * as express from 'express';

@Injectable()
export class PixlFoxRPCService {
    private app = express();

    constructor(private pixlfoxClient: PixlFoxClientService) {
        console.log("Starting RPC service.");

        this.app.get("/", (req, res) => {
            res.send({
                "rpcVersion": "1.0.0",
                "clientVersion": "1.0.0",
                "platform": process.platform
            });
        });

        this.app.get("/account/me", (req, res) => {
            res.redirect("/account/@" + this.pixlfoxClient.accountInfo.username);
        });

        this.app.get("/account/@:accountUsername", (req, res) => {
            res.send(this.pixlfoxClient.accountsEnum.where((e) => { return e.username === req.params.accountUsername; }).firstOrDefault());
        });

        this.app.get("/account/:accountId", (req, res) => {
            res.redirect("/account/@" + this.pixlfoxClient.accounts[req.params.accountId].username);
        });

        this.app.get("/account/me/friends", (req, res) => {
            res.send(this.pixlfoxClient.friends);
        });

        this.app.listen(8850, () => {
            console.log("RPC service running on port 8850.");
        });
     }
}