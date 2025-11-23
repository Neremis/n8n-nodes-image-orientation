# n8n-nodes-image-orientation

This repository contains the n8n community node **Image Orientation**.

The node uses **Tesseract.js** (OSD – Orientation and Script Detection) to analyze an image and detect how the text is oriented. You can then use n8n’s built-in Image node to rotate the image if needed.

[Tesseract](https://github.com/tesseract-ocr/tesseract?tab=readme-ov-file#about) is an open-source OCR (Optical
Character Recognition) engine that can recognize machine-printed text in images (e.g. PNG or JPEG) or in images embedded in PDF files.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

---

- [Installation](#installation)  
- [Compatibility](#compatibility)  
- [Usage](#usage)  
- [Examples](#examples)  
- [Resources](#resources)  

---

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community
nodes documentation.

## Compatibility

This node has been tested with **n8n v1.119.2**, but it should also work on newer and older versions.

## Usage

### Input

- The node expects a **binary image** as input
- The binary property name is configurable in the node settings (default: `data`).

### Output

The node returns the Tesseract.js OSD output as JSON and always passes the binary data through unchanged.

Key output properties include:

- `orientation_degrees`  
  How many degrees the image would need to be rotated **clockwise** so that the text is upright.  
  This value can be used directly in n8n’s Image node to rotate the image.

- `orientation_confidence`  
  How confident Tesseract is that the detected orientation is correct.  
  You can use this in an **IF** node to avoid rotating images when the confidence is too low.

- `textDetected`  
  A boolean indicating whether Tesseract was able to detect enough text to determine an orientation.  
  - `true`  → Orientation values are considered valid.  
  - `false` → Likely no text (or not enough text) was detected in the image.

> Note: The input binary data is always forwarded to the output item unchanged.

## Examples

### Example #1 – Text detected, rotation required

The text is detected and the image should be rotated **270 degrees clockwise** to be upright.

```json
{
  "tesseract_script_id": 12,
  "script": "Latin",
  "script_confidence": 8.703704833984375,
  "orientation_degrees": 270,
  "orientation_confidence": 14.62347412109375,
  "textDetected": true
}
```

### Example #2 – Text detected, no rotation required

The text is detected and the image is already correctly oriented (`orientation_degrees` is `0`).

```json
{
  "tesseract_script_id": 12,
  "script": "Latin",
  "script_confidence": 9.5,
  "orientation_degrees": 0,
  "orientation_confidence": 42.1,
  "textDetected": true
}
```

### Example #3 – No text detected

Tesseract could not detect enough text to determine an orientation.  
All OSD values are `null` and `textDetected` is `false`.

```json
{
  "tesseract_script_id": null,
  "script": null,
  "script_confidence": null,
  "orientation_degrees": null,
  "orientation_confidence": null,
  "textDetected": false
}
```

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Tesseract.js documentation](https://github.com/naptha/tesseract.js/tree/master/docs)
