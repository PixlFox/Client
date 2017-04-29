import { NgModule, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import emojione = require('emojione');

@Pipe({
	name: 'message'
})
export class MessagePipe implements PipeTransform {
	public constructor(private sanitizer: DomSanitizer) { }

	transform(text: string): SafeHtml {
		text = this.escapeHtml(text);
		text = this.urlify(text);
		text = emojione.toImage(text);
		//text = twemoji.parse(emojify(text || ''));
		
		return this.sanitizer.bypassSecurityTrustHtml(text);
	}

	private escapeHtml(unsafe: string) {
		return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;").replace(/'/g, "&#039;");
	}

	private urlify(text) {
		var urlRegex = /(https?:\/\/[^\s]+)/g;
		return text.replace(urlRegex, (url) => {
			return '<a data-link="true" onclick="openLink($(this).prop(\'href\')); return false;" href="' + url + '">' + url + '</a>';
		})
	}

	public openUrl(url: string) {
		console.log(url);
	}
}