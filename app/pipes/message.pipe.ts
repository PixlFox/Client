import { NgModule, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
const { emojify } = require('node-emoji');
const twemoji = require('../../twemoji.npm');

@Pipe({
	name: 'message'
})
export class MessagePipe implements PipeTransform {
	public constructor(private sanitizer: DomSanitizer) { }

	transform(text: string): SafeHtml {
		text = this.escapeHtml(text);
		return this.sanitizer.bypassSecurityTrustHtml(twemoji.parse(emojify(text || '')));
	}

	private escapeHtml(unsafe: string) {
		return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;").replace(/'/g, "&#039;");
	}
}