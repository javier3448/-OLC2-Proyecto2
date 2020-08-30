import { Component, OnInit } from '@angular/core';

import { parser } from "../Translator/TranslatorParser.js";
import { graphExpression, test } from "../Grapher";

var numero = 1;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'Proyecto1';

  ngOnInit(): void {
    test();
  }
}

