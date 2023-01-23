import { hasBuffer, setBuffer } from "./audio/Buffers.js"
import { getLoader } from "./ui/Loader.js"
import { replaceAllString, iOS } from "./Util.js"
export class SoundfontLoader {
	/**
	 *
	 * @param {String} instrument
	 */
	static async loadInstrument(instrument, soundfontName) {
		let baseUrl = "https://gleitz.github.io/midi-js-soundfonts/"
		if (instrument == "percussion") {
			soundfontName = "FluidR3_GM"
			baseUrl = ""
		}
		let fileType = iOS ? "mp3" : "ogg"
		return fetch(
			baseUrl + soundfontName + "/" + instrument + "-" + fileType + ".js"
		)
			.then(response => {
				if (response.ok) {
					getLoader().setLoadMessage(
						"Loaded " + instrument + " from " + soundfontName + " soundfont."
					)
					return response.text()
				}
				throw Error(response.statusText)
			})
			.then(data => {
				let scr = document.createElement("script")
				scr.language = "javascript"
				scr.type = "text/javascript"
				let newData = replaceAllString(data, "Soundfont", soundfontName)
				scr.text = newData
				document.body.appendChild(scr)
			})
			.catch(function (error) {
				console.error("Error fetching soundfont: \n", error)
			})
	}
	static async loadInstruments(instruments) {
		return await Promise.all(
			instruments
				.slice(0)
				.map(instrument => SoundfontLoader.loadInstrument(instrument))
		)
	}
	static async getBuffers(ctx) {
		let sortedBuffers = null
		await SoundfontLoader.createBuffers(ctx).then(
			unsortedBuffers => {
				unsortedBuffers.forEach(noteBuffer => {
					setBuffer(
						noteBuffer.soundfontName,
						noteBuffer.instrument,
						noteBuffer.noteKey,
						noteBuffer.buffer
					)
				})
			},
			error => console.error(error)
		)
		return sortedBuffers
	}
	static async createBuffers(ctx) {
		let promises = []
		for (let soundfontName in window.MIDI) {
			for (let instrument in window.MIDI[soundfontName]) {
				if (!hasBuffer(soundfontName, instrument)) {
					console.log(
						"Loaded '" + soundfontName + "' instrument : " + instrument
					)
					for (let noteKey in window.MIDI[soundfontName][instrument]) {
						let base64Buffer = SoundfontLoader.getBase64Buffer(
							window.MIDI[soundfontName][instrument][noteKey]
						)
						promises.push(
							SoundfontLoader.getNoteBuffer(
								ctx,
								base64Buffer,
								soundfontName,
								noteKey,
								instrument
							)
						)
					}
				}
			}
		}
		return await Promise.all(promises)
	}
	static async getNoteBuffer(
		ctx,
		base64Buffer,
		soundfontName,
		noteKey,
		instrument
	) {
		let promise = new Promise((resolve, reject) => {
			ctx.decodeAudioData(
				base64Buffer,
				decodedBuffer => {
					resolve({
						buffer: decodedBuffer,
						noteKey: noteKey,
						instrument: instrument,
						soundfontName: soundfontName
					})
				},
				error => reject(error)
			)
		})
		return await promise

		//ios can't handle the promise based decodeAudioData
		// return await ctx
		// 	.decodeAudioData(base64Buffer, function (decodedBuffer) {
		// 		audioBuffer = decodedBuffer
		// 	})
		// 	.then(
		// 		() => {
		// 			return {
		// 				buffer: audioBuffer,
		// 				noteKey: noteKey,
		// 				instrument: instrument,
		// 				soundfontName: soundfontName
		// 			}
		// 		},
		// 		e => {
		// 			console.log(e)
		// 		}
		// 	)
	}
	static getBase64Buffer(str) {
		let base64 = str.split(",")[1]
		return Base64Binary.decodeArrayBuffer(base64)
	}
}

var Base64Binary = {
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

	/* will return a  Uint8Array type */
	decodeArrayBuffer: function(input) {
		var bytes = Math.ceil( (3*input.length) / 4.0);
		var ab = new ArrayBuffer(bytes);
		this.decode(input, ab);

		return ab;
	},

	decode: function(input, arrayBuffer) {
		//get last chars to see if are valid
		var lkey1 = this._keyStr.indexOf(input.charAt(input.length-1));		 
		var lkey2 = this._keyStr.indexOf(input.charAt(input.length-1));		 

		var bytes = Math.ceil( (3*input.length) / 4.0);
		if (lkey1 == 64) bytes--; //padding chars, so skip
		if (lkey2 == 64) bytes--; //padding chars, so skip

		var uarray;
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;
		var j = 0;

		if (arrayBuffer)
			uarray = new Uint8Array(arrayBuffer);
		else
			uarray = new Uint8Array(bytes);

		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

		for (i=0; i<bytes; i+=3) {	
			//get the 3 octects in 4 ascii chars
			enc1 = this._keyStr.indexOf(input.charAt(j++));
			enc2 = this._keyStr.indexOf(input.charAt(j++));
			enc3 = this._keyStr.indexOf(input.charAt(j++));
			enc4 = this._keyStr.indexOf(input.charAt(j++));

			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;

			uarray[i] = chr1;			
			if (enc3 != 64) uarray[i+1] = chr2;
			if (enc4 != 64) uarray[i+2] = chr3;
		}

		return uarray;	
	}
};