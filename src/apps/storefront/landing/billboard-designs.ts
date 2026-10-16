import type { LandingSettings, BillboardVariant } from './document';
export interface BillboardNode { tag?: string; class?: string; style?: string; children?: readonly BillboardNode[]; slot?: string; index?: number; length?: number; field?: string; repeat?: boolean }
export const billboardDesigns = [
  {
    "id": "billboard-1",
    "index": 1,
    "sampleTitleLength": 0,
    "sampleTextLength": 0,
    "hasArtwork": true,
    "fadeImage": false,
    "name": "لوحة إعلانية 1",
    "advanced": true,
    "controlColors": [
      "#ffffff",
      "#000000"
    ],
    "verticalLocked": false,
    "count": 0,
    "hasImage": true,
    "purchase": true,
    "reversed": false,
    "preview": {
      "width": 398,
      "height": 743
    },
    "ratios": [
      [
        1000,
        1000
      ]
    ],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h1",
          "children": [
            {
              "length": 8,
              "slot": "title"
            }
          ]
        },
        {
          "tag": "h4",
          "children": [
            {
              "tag": "em",
              "children": [
                {
                  "length": 16,
                  "slot": "description"
                }
              ]
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h3",
          "children": [
            {
              "length": 18,
              "slot": "eyebrow"
            }
          ]
        }
      ]
    },
    "slots": [
      {
        "slot": "title"
      },
      {
        "slot": "description"
      },
      {
        "slot": "eyebrow"
      }
    ]
  },
  {
    "id": "billboard-2",
    "index": 2,
    "sampleTitleLength": 0,
    "sampleTextLength": 0,
    "hasArtwork": true,
    "fadeImage": false,
    "name": "لوحة إعلانية 2",
    "advanced": true,
    "controlColors": [
      "#ffffff",
      "#000000"
    ],
    "verticalLocked": false,
    "count": 0,
    "hasImage": true,
    "purchase": true,
    "reversed": false,
    "preview": {
      "width": 394,
      "height": 807
    },
    "ratios": [
      [
        1000,
        1000
      ]
    ],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h1",
          "children": [
            {
              "length": 18,
              "slot": "title"
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h4",
          "children": [
            {
              "tag": "em",
              "children": [
                {
                  "length": 16,
                  "slot": "description"
                }
              ]
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h3",
          "children": [
            {
              "length": 8,
              "slot": "eyebrow"
            }
          ]
        }
      ]
    },
    "slots": [
      {
        "slot": "title"
      },
      {
        "slot": "description"
      },
      {
        "slot": "eyebrow"
      }
    ]
  },
  {
    "id": "billboard-3",
    "index": 3,
    "sampleTitleLength": 0,
    "sampleTextLength": 0,
    "hasArtwork": true,
    "fadeImage": false,
    "name": "لوحة إعلانية 3",
    "advanced": true,
    "controlColors": [
      "#ffffff",
      "#000000"
    ],
    "verticalLocked": true,
    "count": 0,
    "hasImage": true,
    "purchase": true,
    "reversed": true,
    "preview": {
      "width": 398,
      "height": 852
    },
    "ratios": [
      [
        900,
        1198
      ]
    ],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h1",
          "children": [
            {
              "length": 8,
              "slot": "title"
            }
          ]
        },
        {
          "tag": "h4",
          "children": [
            {
              "tag": "em",
              "children": [
                {
                  "length": 16,
                  "slot": "description"
                }
              ]
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h3",
          "children": [
            {
              "length": 18,
              "slot": "eyebrow"
            }
          ]
        }
      ]
    },
    "slots": [
      {
        "slot": "title"
      },
      {
        "slot": "description"
      },
      {
        "slot": "eyebrow"
      }
    ]
  },
  {
    "id": "billboard-4",
    "index": 4,
    "sampleTitleLength": 0,
    "sampleTextLength": 0,
    "hasArtwork": true,
    "fadeImage": false,
    "name": "لوحة إعلانية 4",
    "advanced": true,
    "controlColors": [
      "#ffffff",
      "#000000"
    ],
    "verticalLocked": false,
    "count": 0,
    "hasImage": true,
    "purchase": true,
    "reversed": false,
    "preview": {
      "width": 397,
      "height": 740
    },
    "ratios": [
      [
        1000,
        1000
      ]
    ],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h1",
          "children": [
            {
              "length": 8,
              "slot": "title"
            }
          ]
        },
        {
          "tag": "h4",
          "children": [
            {
              "tag": "em",
              "children": [
                {
                  "length": 16,
                  "slot": "description"
                }
              ]
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h3",
          "children": [
            {
              "length": 18,
              "slot": "eyebrow"
            }
          ]
        }
      ]
    },
    "slots": [
      {
        "slot": "title"
      },
      {
        "slot": "description"
      },
      {
        "slot": "eyebrow"
      }
    ]
  },
  {
    "id": "billboard-5",
    "index": 5,
    "sampleTitleLength": 0,
    "sampleTextLength": 0,
    "hasArtwork": true,
    "fadeImage": false,
    "name": "لوحة إعلانية 5",
    "advanced": true,
    "controlColors": [
      "#ffffff",
      "#000000"
    ],
    "verticalLocked": false,
    "count": 0,
    "hasImage": true,
    "purchase": true,
    "reversed": false,
    "preview": {
      "width": 395,
      "height": 695
    },
    "ratios": [
      [
        900,
        619
      ]
    ],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h1",
          "children": [
            {
              "length": 20,
              "slot": "title"
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h4",
          "children": [
            {
              "tag": "em",
              "children": [
                {
                  "length": 16,
                  "slot": "description"
                }
              ]
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h3",
          "children": [
            {
              "length": 8,
              "slot": "eyebrow"
            }
          ]
        }
      ]
    },
    "slots": [
      {
        "slot": "title"
      },
      {
        "slot": "description"
      },
      {
        "slot": "eyebrow"
      }
    ]
  },
  {
    "id": "billboard-6",
    "index": 6,
    "sampleTitleLength": 0,
    "sampleTextLength": 0,
    "hasArtwork": true,
    "fadeImage": false,
    "name": "لوحة إعلانية 6",
    "advanced": true,
    "controlColors": [
      "#ffffff",
      "#000000"
    ],
    "verticalLocked": false,
    "count": 0,
    "hasImage": true,
    "purchase": true,
    "reversed": false,
    "preview": {
      "width": 395,
      "height": 811
    },
    "ratios": [
      [
        1000,
        1000
      ]
    ],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h1",
          "children": [
            {
              "length": 29,
              "slot": "title"
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h4",
          "children": [
            {
              "tag": "em",
              "children": [
                {
                  "length": 16,
                  "slot": "description"
                }
              ]
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h3",
          "children": [
            {
              "length": 8,
              "slot": "eyebrow"
            }
          ]
        }
      ]
    },
    "slots": [
      {
        "slot": "title"
      },
      {
        "slot": "description"
      },
      {
        "slot": "eyebrow"
      }
    ]
  },
  {
    "id": "billboard-7",
    "index": 7,
    "sampleTitleLength": 0,
    "sampleTextLength": 0,
    "hasArtwork": true,
    "fadeImage": false,
    "name": "لوحة إعلانية 7",
    "advanced": true,
    "controlColors": [
      "#ffffff",
      "#000000"
    ],
    "verticalLocked": false,
    "count": 0,
    "hasImage": true,
    "purchase": true,
    "reversed": false,
    "preview": {
      "width": 398,
      "height": 809
    },
    "ratios": [
      [
        1000,
        1000
      ]
    ],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h1",
          "children": [
            {
              "length": 27,
              "slot": "title"
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h4",
          "children": [
            {
              "tag": "em",
              "children": [
                {
                  "length": 16,
                  "slot": "description"
                }
              ]
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h3",
          "children": [
            {
              "length": 8,
              "slot": "eyebrow"
            }
          ]
        }
      ]
    },
    "slots": [
      {
        "slot": "title"
      },
      {
        "slot": "description"
      },
      {
        "slot": "eyebrow"
      }
    ]
  },
  {
    "id": "billboard-8",
    "index": 8,
    "sampleTitleLength": 0,
    "sampleTextLength": 0,
    "hasArtwork": true,
    "fadeImage": false,
    "name": "لوحة إعلانية 8",
    "advanced": true,
    "controlColors": [
      "#ffffff",
      "#000000"
    ],
    "verticalLocked": false,
    "count": 0,
    "hasImage": true,
    "purchase": true,
    "reversed": false,
    "preview": {
      "width": 397,
      "height": 813
    },
    "ratios": [
      [
        1024,
        1024
      ]
    ],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h1",
          "children": [
            {
              "length": 27,
              "slot": "title"
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h4",
          "children": [
            {
              "tag": "em",
              "children": [
                {
                  "length": 16,
                  "slot": "description"
                }
              ]
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h3",
          "children": [
            {
              "length": 8,
              "slot": "eyebrow"
            }
          ]
        }
      ]
    },
    "slots": [
      {
        "slot": "title"
      },
      {
        "slot": "description"
      },
      {
        "slot": "eyebrow"
      }
    ]
  },
  {
    "id": "billboard-9",
    "index": 9,
    "sampleTitleLength": 0,
    "sampleTextLength": 0,
    "hasArtwork": true,
    "fadeImage": false,
    "name": "لوحة إعلانية 9",
    "advanced": true,
    "controlColors": [
      "#ffffff",
      "#000000"
    ],
    "verticalLocked": false,
    "count": 0,
    "hasImage": true,
    "purchase": true,
    "reversed": false,
    "preview": {
      "width": 396,
      "height": 854
    },
    "ratios": [
      [
        900,
        1350
      ]
    ],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h1",
          "children": [
            {
              "length": 8,
              "slot": "title"
            }
          ]
        },
        {
          "tag": "h4",
          "children": [
            {
              "tag": "em",
              "children": [
                {
                  "length": 16,
                  "slot": "description"
                }
              ]
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h3",
          "children": [
            {
              "length": 18,
              "slot": "eyebrow"
            }
          ]
        }
      ]
    },
    "slots": [
      {
        "slot": "title"
      },
      {
        "slot": "description"
      },
      {
        "slot": "eyebrow"
      }
    ]
  },
  {
    "id": "billboard-10",
    "index": 10,
    "sampleTitleLength": 0,
    "sampleTextLength": 0,
    "hasArtwork": true,
    "fadeImage": false,
    "name": "لوحة إعلانية 10",
    "advanced": true,
    "controlColors": [
      "#ffffff",
      "#000000"
    ],
    "verticalLocked": false,
    "count": 0,
    "hasImage": true,
    "purchase": true,
    "reversed": false,
    "preview": {
      "width": 398,
      "height": 851
    },
    "ratios": [
      [
        500,
        500
      ]
    ],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h1",
          "children": [
            {
              "length": 41,
              "slot": "title"
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h4",
          "children": [
            {
              "tag": "em",
              "children": [
                {
                  "length": 16,
                  "slot": "description"
                }
              ]
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h3",
          "children": [
            {
              "length": 8,
              "slot": "eyebrow"
            }
          ]
        }
      ]
    },
    "slots": [
      {
        "slot": "title"
      },
      {
        "slot": "description"
      },
      {
        "slot": "eyebrow"
      }
    ]
  },
  {
    "id": "billboard-11",
    "index": 11,
    "sampleTitleLength": 0,
    "sampleTextLength": 0,
    "hasArtwork": true,
    "fadeImage": false,
    "name": "لوحة إعلانية 11",
    "advanced": true,
    "controlColors": [
      "#ffffff",
      "#000000"
    ],
    "verticalLocked": false,
    "count": 0,
    "hasImage": true,
    "purchase": true,
    "reversed": false,
    "preview": {
      "width": 397,
      "height": 737
    },
    "ratios": [
      [
        1000,
        1000
      ]
    ],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h1",
          "children": [
            {
              "length": 8,
              "slot": "title"
            }
          ]
        },
        {
          "tag": "h4",
          "children": [
            {
              "tag": "em",
              "children": [
                {
                  "length": 16,
                  "slot": "description"
                }
              ]
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h3",
          "children": [
            {
              "length": 18,
              "slot": "eyebrow"
            }
          ]
        }
      ]
    },
    "slots": [
      {
        "slot": "title"
      },
      {
        "slot": "description"
      },
      {
        "slot": "eyebrow"
      }
    ]
  },
  {
    "id": "billboard-12",
    "index": 12,
    "sampleTitleLength": 76,
    "sampleTextLength": 26,
    "hasArtwork": true,
    "fadeImage": false,
    "name": "لوحة إعلانية 12",
    "advanced": false,
    "controlColors": [
      "#ffffff",
      "#ffffff",
      "#ffffff",
      "#000000",
      "#000000",
      "#000000",
      "#000000"
    ],
    "verticalLocked": false,
    "count": 1,
    "hasImage": true,
    "purchase": true,
    "reversed": false,
    "preview": {
      "width": 396,
      "height": 340
    },
    "ratios": [
      [
        400,
        400
      ]
    ],
    "schema": {
      "tag": "div",
      "children": []
    },
    "slots": []
  },
  {
    "id": "billboard-13",
    "index": 13,
    "sampleTitleLength": 0,
    "sampleTextLength": 0,
    "hasArtwork": true,
    "fadeImage": false,
    "name": "لوحة إعلانية 13",
    "advanced": true,
    "controlColors": [
      "#ffffff",
      "#000000"
    ],
    "verticalLocked": true,
    "count": 0,
    "hasImage": true,
    "purchase": true,
    "reversed": true,
    "preview": {
      "width": 398,
      "height": 853
    },
    "ratios": [
      [
        985,
        1280
      ]
    ],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h3",
          "children": [
            {
              "length": 12,
              "slot": "eyebrow"
            }
          ]
        },
        {
          "tag": "h1",
          "children": [
            {
              "length": 17,
              "slot": "title"
            }
          ]
        },
        {
          "tag": "h4",
          "children": [
            {
              "length": 10,
              "slot": "description"
            }
          ]
        }
      ]
    },
    "slots": [
      {
        "slot": "title"
      },
      {
        "slot": "description"
      },
      {
        "slot": "eyebrow"
      }
    ]
  },
  {
    "id": "billboard-14",
    "index": 14,
    "sampleTitleLength": 0,
    "sampleTextLength": 0,
    "hasArtwork": true,
    "fadeImage": false,
    "name": "لوحة إعلانية 14",
    "advanced": true,
    "controlColors": [
      "#ffffff",
      "#000000"
    ],
    "verticalLocked": false,
    "count": 0,
    "hasImage": true,
    "purchase": true,
    "reversed": false,
    "preview": {
      "width": 397,
      "height": 785
    },
    "ratios": [
      [
        1000,
        1000
      ]
    ],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h1",
          "children": [
            {
              "length": 33,
              "slot": "title"
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h4",
          "children": [
            {
              "tag": "em",
              "children": [
                {
                  "length": 16,
                  "slot": "description"
                }
              ]
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h3",
          "children": [
            {
              "length": 8,
              "slot": "eyebrow"
            }
          ]
        }
      ]
    },
    "slots": [
      {
        "slot": "title"
      },
      {
        "slot": "description"
      },
      {
        "slot": "eyebrow"
      }
    ]
  },
  {
    "id": "billboard-15",
    "index": 15,
    "sampleTitleLength": 0,
    "sampleTextLength": 0,
    "hasArtwork": true,
    "fadeImage": true,
    "name": "لوحة إعلانية 15",
    "advanced": true,
    "controlColors": [
      "#ffffff",
      "#000000"
    ],
    "verticalLocked": true,
    "count": 0,
    "hasImage": true,
    "purchase": true,
    "reversed": true,
    "preview": {
      "width": 397,
      "height": 805
    },
    "ratios": [
      [
        1000,
        1000
      ]
    ],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h1",
          "children": [
            {
              "length": 31,
              "slot": "title"
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h4",
          "children": [
            {
              "tag": "em",
              "children": [
                {
                  "length": 16,
                  "slot": "description"
                }
              ]
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h3",
          "children": [
            {
              "tag": "strong",
              "children": [
                {
                  "length": 5,
                  "slot": "eyebrow"
                }
              ]
            },
            {
              "length": 24,
              "slot": "eyebrow"
            }
          ]
        }
      ]
    },
    "slots": [
      {
        "slot": "title"
      },
      {
        "slot": "description"
      },
      {
        "slot": "eyebrow"
      }
    ]
  },
  {
    "id": "billboard-16",
    "index": 16,
    "sampleTitleLength": 0,
    "sampleTextLength": 0,
    "hasArtwork": true,
    "fadeImage": true,
    "name": "لوحة إعلانية 16",
    "advanced": true,
    "controlColors": [
      "#ffffff",
      "#000000"
    ],
    "verticalLocked": false,
    "count": 0,
    "hasImage": true,
    "purchase": true,
    "reversed": false,
    "preview": {
      "width": 395,
      "height": 778
    },
    "ratios": [
      [
        1000,
        1000
      ]
    ],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h1",
          "children": [
            {
              "length": 35,
              "slot": "title"
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h4",
          "children": [
            {
              "tag": "em",
              "children": [
                {
                  "length": 16,
                  "slot": "description"
                }
              ]
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h3",
          "children": [
            {
              "length": 8,
              "slot": "eyebrow"
            }
          ]
        }
      ]
    },
    "slots": [
      {
        "slot": "title"
      },
      {
        "slot": "description"
      },
      {
        "slot": "eyebrow"
      }
    ]
  },
  {
    "id": "billboard-17",
    "index": 17,
    "sampleTitleLength": 0,
    "sampleTextLength": 0,
    "hasArtwork": true,
    "fadeImage": true,
    "name": "لوحة إعلانية 17",
    "advanced": true,
    "controlColors": [
      "#ffffff",
      "#000000"
    ],
    "verticalLocked": false,
    "count": 0,
    "hasImage": true,
    "purchase": true,
    "reversed": false,
    "preview": {
      "width": 395,
      "height": 676
    },
    "ratios": [
      [
        774,
        561
      ]
    ],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h1",
          "children": [
            {
              "length": 49,
              "slot": "title"
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h4",
          "children": [
            {
              "tag": "em",
              "children": [
                {
                  "length": 16,
                  "slot": "description"
                }
              ]
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h3",
          "children": [
            {
              "length": 8,
              "slot": "eyebrow"
            }
          ]
        }
      ]
    },
    "slots": [
      {
        "slot": "title"
      },
      {
        "slot": "description"
      },
      {
        "slot": "eyebrow"
      }
    ]
  },
  {
    "id": "billboard-18",
    "index": 18,
    "sampleTitleLength": 0,
    "sampleTextLength": 0,
    "hasArtwork": true,
    "fadeImage": true,
    "name": "لوحة إعلانية 18",
    "advanced": true,
    "controlColors": [
      "#ffffff",
      "#000000"
    ],
    "verticalLocked": false,
    "count": 0,
    "hasImage": true,
    "purchase": true,
    "reversed": false,
    "preview": {
      "width": 394,
      "height": 664
    },
    "ratios": [
      [
        900,
        634
      ]
    ],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h1",
          "children": [
            {
              "length": 22,
              "slot": "title"
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h4",
          "children": [
            {
              "tag": "em",
              "children": [
                {
                  "length": 16,
                  "slot": "description"
                }
              ]
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h3",
          "children": [
            {
              "length": 8,
              "slot": "eyebrow"
            }
          ]
        }
      ]
    },
    "slots": [
      {
        "slot": "title"
      },
      {
        "slot": "description"
      },
      {
        "slot": "eyebrow"
      }
    ]
  }
] as const;
export const billboardDesign = (id?:string) => billboardDesigns.find(d=>d.id===id)??billboardDesigns[0];
export const billboardDefaults = (id:BillboardVariant):Partial<LandingSettings> => ({variant:id});
