import type { LandingSettings, DescriptionVariant } from './document';
export interface DescriptionNode { tag?: string; class?: string; style?: string; children?: readonly DescriptionNode[]; slot?: string; index?: number; length?: number; field?: string; repeat?: boolean }
export const descriptionDesigns = [
  {
    "id": "description-1",
    "name": "وصف المنتج 1",
    "advanced": true,
    "controlColors": [
      "#ffffff"
    ],
    "verticalLocked": true,
    "count": 4,
    "hasImage": true,
    "purchase": false,
    "reversed": true,
    "preview": {
      "width": 900,
      "height": 400
    },
    "ratios": [
      [
        900,
        853
      ]
    ],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h4",
          "children": [
            {
              "length": 11,
              "slot": "title"
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h2",
          "children": [
            {
              "length": 150,
              "slot": "description"
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "ul",
          "children": [
            {
              "tag": "li",
              "children": [
                {
                  "length": 27,
                  "slot": "item",
                  "index": 0
                }
              ],
              "class": "ql-align-right"
            },
            {
              "tag": "li",
              "children": [
                {
                  "length": 24,
                  "slot": "item",
                  "index": 1
                }
              ],
              "class": "ql-align-right"
            },
            {
              "tag": "li",
              "children": [
                {
                  "length": 11,
                  "slot": "item",
                  "index": 2
                }
              ],
              "class": "ql-align-right"
            },
            {
              "tag": "li",
              "children": [
                {
                  "length": 22,
                  "slot": "item",
                  "index": 3
                }
              ],
              "class": "ql-align-right"
            }
          ],
          "repeat": true
        }
      ]
    },
    "slots": [
      {
        "slot": "title",
        "index": null,
        "tag": "h4",
        "length": 11
      },
      {
        "slot": "description",
        "index": null,
        "tag": "h2",
        "length": 150
      },
      {
        "slot": "item",
        "index": 0,
        "tag": "li",
        "length": 27
      },
      {
        "slot": "item",
        "index": 1,
        "tag": "li",
        "length": 24
      },
      {
        "slot": "item",
        "index": 2,
        "tag": "li",
        "length": 11
      },
      {
        "slot": "item",
        "index": 3,
        "tag": "li",
        "length": 22
      }
    ]
  },
  {
    "id": "description-2",
    "name": "وصف المنتج 2",
    "advanced": true,
    "controlColors": [
      "#ffffff"
    ],
    "verticalLocked": false,
    "count": 4,
    "hasImage": false,
    "purchase": false,
    "reversed": true,
    "preview": {
      "width": 900,
      "height": 321
    },
    "ratios": [],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h4",
          "children": [
            {
              "length": 11,
              "slot": "title"
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h2",
          "children": [
            {
              "length": 150,
              "slot": "description"
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "ul",
          "children": [
            {
              "tag": "li",
              "children": [
                {
                  "length": 27,
                  "slot": "item",
                  "index": 0
                }
              ],
              "class": "ql-align-right"
            },
            {
              "tag": "li",
              "children": [
                {
                  "length": 24,
                  "slot": "item",
                  "index": 1
                }
              ],
              "class": "ql-align-right"
            },
            {
              "tag": "li",
              "children": [
                {
                  "length": 11,
                  "slot": "item",
                  "index": 2
                }
              ],
              "class": "ql-align-right"
            },
            {
              "tag": "li",
              "children": [
                {
                  "length": 22,
                  "slot": "item",
                  "index": 3
                }
              ],
              "class": "ql-align-right"
            }
          ],
          "repeat": true
        }
      ]
    },
    "slots": [
      {
        "slot": "title",
        "index": null,
        "tag": "h4",
        "length": 11
      },
      {
        "slot": "description",
        "index": null,
        "tag": "h2",
        "length": 150
      },
      {
        "slot": "item",
        "index": 0,
        "tag": "li",
        "length": 27
      },
      {
        "slot": "item",
        "index": 1,
        "tag": "li",
        "length": 24
      },
      {
        "slot": "item",
        "index": 2,
        "tag": "li",
        "length": 11
      },
      {
        "slot": "item",
        "index": 3,
        "tag": "li",
        "length": 22
      }
    ]
  },
  {
    "id": "description-3",
    "name": "وصف المنتج 3",
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
      "width": 900,
      "height": 349
    },
    "ratios": [
      [
        875,
        691
      ]
    ],
    "schema": {
      "tag": "div",
      "children": []
    },
    "slots": []
  },
  {
    "id": "description-4",
    "name": "وصف المنتج 4",
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
      "width": 900,
      "height": 340
    },
    "ratios": [
      [
        900,
        900
      ]
    ],
    "schema": {
      "tag": "div",
      "children": []
    },
    "slots": []
  },
  {
    "id": "description-5",
    "name": "وصف المنتج 5",
    "advanced": true,
    "controlColors": [
      "#ffffff"
    ],
    "verticalLocked": false,
    "count": 4,
    "hasImage": false,
    "purchase": false,
    "reversed": true,
    "preview": {
      "width": 900,
      "height": 315
    },
    "ratios": [],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h4",
          "children": [
            {
              "length": 11,
              "slot": "title"
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h2",
          "children": [
            {
              "length": 150,
              "slot": "description"
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "ul",
          "children": [
            {
              "tag": "li",
              "children": [
                {
                  "length": 27,
                  "slot": "item",
                  "index": 0
                }
              ],
              "class": "ql-align-right"
            },
            {
              "tag": "li",
              "children": [
                {
                  "length": 24,
                  "slot": "item",
                  "index": 1
                }
              ],
              "class": "ql-align-right"
            },
            {
              "tag": "li",
              "children": [
                {
                  "length": 11,
                  "slot": "item",
                  "index": 2
                }
              ],
              "class": "ql-align-right"
            },
            {
              "tag": "li",
              "children": [
                {
                  "length": 22,
                  "slot": "item",
                  "index": 3
                }
              ],
              "class": "ql-align-right"
            }
          ],
          "repeat": true
        }
      ]
    },
    "slots": [
      {
        "slot": "title",
        "index": null,
        "tag": "h4",
        "length": 11
      },
      {
        "slot": "description",
        "index": null,
        "tag": "h2",
        "length": 150
      },
      {
        "slot": "item",
        "index": 0,
        "tag": "li",
        "length": 27
      },
      {
        "slot": "item",
        "index": 1,
        "tag": "li",
        "length": 24
      },
      {
        "slot": "item",
        "index": 2,
        "tag": "li",
        "length": 11
      },
      {
        "slot": "item",
        "index": 3,
        "tag": "li",
        "length": 22
      }
    ]
  },
  {
    "id": "description-6",
    "name": "وصف المنتج 6",
    "advanced": true,
    "controlColors": [
      "#ffffff"
    ],
    "verticalLocked": true,
    "count": 4,
    "hasImage": true,
    "purchase": false,
    "reversed": true,
    "preview": {
      "width": 900,
      "height": 422
    },
    "ratios": [
      [
        900,
        853
      ]
    ],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h4",
          "children": [
            {
              "length": 11,
              "slot": "title"
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h2",
          "children": [
            {
              "length": 150,
              "slot": "description"
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "ul",
          "children": [
            {
              "tag": "li",
              "children": [
                {
                  "length": 27,
                  "slot": "item",
                  "index": 0
                }
              ],
              "class": "ql-align-right"
            },
            {
              "tag": "li",
              "children": [
                {
                  "length": 24,
                  "slot": "item",
                  "index": 1
                }
              ],
              "class": "ql-align-right"
            },
            {
              "tag": "li",
              "children": [
                {
                  "length": 11,
                  "slot": "item",
                  "index": 2
                }
              ],
              "class": "ql-align-right"
            },
            {
              "tag": "li",
              "children": [
                {
                  "length": 22,
                  "slot": "item",
                  "index": 3
                }
              ],
              "class": "ql-align-right"
            }
          ],
          "repeat": true
        }
      ]
    },
    "slots": [
      {
        "slot": "title",
        "index": null,
        "tag": "h4",
        "length": 11
      },
      {
        "slot": "description",
        "index": null,
        "tag": "h2",
        "length": 150
      },
      {
        "slot": "item",
        "index": 0,
        "tag": "li",
        "length": 27
      },
      {
        "slot": "item",
        "index": 1,
        "tag": "li",
        "length": 24
      },
      {
        "slot": "item",
        "index": 2,
        "tag": "li",
        "length": 11
      },
      {
        "slot": "item",
        "index": 3,
        "tag": "li",
        "length": 22
      }
    ]
  },
  {
    "id": "description-7",
    "name": "وصف المنتج 7",
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
      "width": 900,
      "height": 374
    },
    "ratios": [
      [
        900,
        638
      ]
    ],
    "schema": {
      "tag": "div",
      "children": []
    },
    "slots": []
  },
  {
    "id": "description-8",
    "name": "وصف المنتج 8",
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
      "width": 900,
      "height": 391
    },
    "ratios": [
      [
        900,
        882
      ]
    ],
    "schema": {
      "tag": "div",
      "children": []
    },
    "slots": []
  },
  {
    "id": "description-9",
    "name": "وصف المنتج 9",
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
      "width": 900,
      "height": 372
    },
    "ratios": [
      [
        900,
        726
      ]
    ],
    "schema": {
      "tag": "div",
      "children": []
    },
    "slots": []
  },
  {
    "id": "description-10",
    "name": "وصف المنتج 10",
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
      "width": 900,
      "height": 345
    },
    "ratios": [
      [
        590,
        480
      ]
    ],
    "schema": {
      "tag": "div",
      "children": []
    },
    "slots": []
  },
  {
    "id": "description-11",
    "name": "وصف المنتج 11",
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
      "width": 900,
      "height": 334
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
    "id": "description-12",
    "name": "وصف المنتج 12",
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
      "width": 900,
      "height": 529
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
    "id": "description-13",
    "name": "وصف المنتج 13",
    "advanced": true,
    "controlColors": [
      "#ffffff"
    ],
    "verticalLocked": false,
    "count": 3,
    "hasImage": false,
    "purchase": false,
    "reversed": true,
    "preview": {
      "width": 797,
      "height": 164
    },
    "ratios": [],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h1",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 5,
                  "slot": "title"
                }
              ],
              "style": "white-space: pre-wrap"
            }
          ]
        },
        {
          "tag": "h2",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 3,
                  "slot": "description"
                }
              ],
              "style": "white-space: pre-wrap"
            }
          ]
        },
        {
          "tag": "h3",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 7,
                  "slot": "item",
                  "index": 0
                }
              ],
              "style": "white-space: pre-wrap"
            }
          ]
        },
        {
          "tag": "h4",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 4,
                  "slot": "item",
                  "index": 1
                }
              ],
              "style": "white-space: pre-wrap"
            }
          ]
        },
        {
          "tag": "h5",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 4,
                  "slot": "item",
                  "index": 2
                }
              ],
              "style": "white-space: pre-wrap"
            }
          ]
        }
      ]
    },
    "slots": [
      {
        "slot": "title",
        "index": null,
        "tag": "h1",
        "length": 5
      },
      {
        "slot": "description",
        "index": null,
        "tag": "h2",
        "length": 3
      },
      {
        "slot": "item",
        "index": 0,
        "tag": "h3",
        "length": 7
      },
      {
        "slot": "item",
        "index": 1,
        "tag": "h4",
        "length": 4
      },
      {
        "slot": "item",
        "index": 2,
        "tag": "h5",
        "length": 4
      }
    ]
  },
  {
    "id": "description-14",
    "name": "وصف المنتج 14",
    "advanced": true,
    "controlColors": [
      "#ffffff"
    ],
    "verticalLocked": false,
    "count": 7,
    "hasImage": true,
    "purchase": false,
    "reversed": false,
    "preview": {
      "width": 395,
      "height": 814
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
          "tag": "h2",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 29,
                  "slot": "title"
                }
              ],
              "style": "white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        },
        {
          "tag": "h3",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 36,
                  "slot": "description"
                }
              ],
              "style": "white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        },
        {
          "tag": "h1",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 90,
                  "slot": "item",
                  "index": 0
                }
              ],
              "style": "white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        },
        {
          "tag": "ul",
          "children": [
            {
              "tag": "li",
              "children": [
                {
                  "tag": "span",
                  "children": [
                    {
                      "length": 23,
                      "slot": "item",
                      "index": 1
                    }
                  ],
                  "style": "white-space: pre-wrap"
                }
              ],
              "style": "text-align: right"
            },
            {
              "tag": "li",
              "children": [
                {
                  "tag": "span",
                  "children": [
                    {
                      "length": 28,
                      "slot": "item",
                      "index": 2
                    }
                  ],
                  "style": "white-space: pre-wrap"
                }
              ],
              "style": "text-align: right"
            },
            {
              "tag": "li",
              "children": [
                {
                  "tag": "span",
                  "children": [
                    {
                      "length": 25,
                      "slot": "item",
                      "index": 3
                    }
                  ],
                  "style": "white-space: pre-wrap"
                }
              ],
              "style": "text-align: right"
            },
            {
              "tag": "li",
              "children": [
                {
                  "tag": "span",
                  "children": [
                    {
                      "length": 24,
                      "slot": "item",
                      "index": 4
                    }
                  ],
                  "style": "white-space: pre-wrap"
                }
              ],
              "style": "text-align: right"
            },
            {
              "tag": "li",
              "children": [
                {
                  "tag": "span",
                  "children": [
                    {
                      "length": 26,
                      "slot": "item",
                      "index": 5
                    }
                  ],
                  "style": "white-space: pre-wrap"
                }
              ],
              "style": "text-align: right"
            },
            {
              "tag": "li",
              "children": [
                {
                  "tag": "span",
                  "children": [
                    {
                      "length": 30,
                      "slot": "item",
                      "index": 6
                    }
                  ],
                  "style": "white-space: pre-wrap"
                }
              ],
              "style": "text-align: right"
            }
          ],
          "repeat": true
        }
      ]
    },
    "slots": [
      {
        "slot": "title",
        "index": null,
        "tag": "h2",
        "length": 29
      },
      {
        "slot": "description",
        "index": null,
        "tag": "h3",
        "length": 36
      },
      {
        "slot": "item",
        "index": 0,
        "tag": "h1",
        "length": 90
      },
      {
        "slot": "item",
        "index": 1,
        "tag": "li",
        "length": 23
      },
      {
        "slot": "item",
        "index": 2,
        "tag": "li",
        "length": 28
      },
      {
        "slot": "item",
        "index": 3,
        "tag": "li",
        "length": 25
      },
      {
        "slot": "item",
        "index": 4,
        "tag": "li",
        "length": 24
      },
      {
        "slot": "item",
        "index": 5,
        "tag": "li",
        "length": 26
      },
      {
        "slot": "item",
        "index": 6,
        "tag": "li",
        "length": 30
      }
    ]
  },
  {
    "id": "description-15",
    "name": "وصف المنتج 15",
    "advanced": true,
    "controlColors": [
      "#ffffff",
      "#000000"
    ],
    "verticalLocked": false,
    "count": 14,
    "hasImage": false,
    "purchase": true,
    "reversed": true,
    "preview": {
      "width": 395,
      "height": 484
    },
    "ratios": [],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h4",
          "children": [
            {
              "length": 15,
              "slot": "title"
            }
          ],
          "class": "ql-align-center"
        },
        {
          "tag": "ul",
          "children": [
            {
              "tag": "li",
              "children": [
                {
                  "length": 6,
                  "slot": "item",
                  "index": 0
                }
              ]
            },
            {
              "tag": "li",
              "children": [
                {
                  "length": 13,
                  "slot": "item",
                  "index": 1
                }
              ]
            },
            {
              "tag": "li",
              "children": [
                {
                  "length": 14,
                  "slot": "item",
                  "index": 2
                }
              ]
            },
            {
              "tag": "li",
              "children": [
                {
                  "length": 7,
                  "slot": "item",
                  "index": 3
                }
              ]
            },
            {
              "tag": "li",
              "children": [
                {
                  "length": 18,
                  "slot": "item",
                  "index": 4
                }
              ]
            },
            {
              "tag": "li",
              "children": [
                {
                  "length": 3,
                  "slot": "item",
                  "index": 5
                }
              ]
            },
            {
              "tag": "li",
              "children": [
                {
                  "length": 11,
                  "slot": "item",
                  "index": 6
                }
              ]
            },
            {
              "tag": "li",
              "children": [
                {
                  "length": 4,
                  "slot": "item",
                  "index": 7
                }
              ]
            },
            {
              "tag": "li",
              "children": [
                {
                  "length": 6,
                  "slot": "item",
                  "index": 8
                }
              ]
            },
            {
              "tag": "li",
              "children": [
                {
                  "length": 3,
                  "slot": "item",
                  "index": 9
                }
              ]
            },
            {
              "tag": "li",
              "children": [
                {
                  "length": 9,
                  "slot": "item",
                  "index": 10
                }
              ]
            },
            {
              "tag": "li",
              "children": [
                {
                  "length": 3,
                  "slot": "item",
                  "index": 11
                }
              ]
            },
            {
              "tag": "li",
              "children": [
                {
                  "length": 7,
                  "slot": "item",
                  "index": 12
                }
              ]
            },
            {
              "tag": "li",
              "children": [
                {
                  "length": 8,
                  "slot": "item",
                  "index": 13
                }
              ]
            }
          ],
          "repeat": true
        }
      ]
    },
    "slots": [
      {
        "slot": "title",
        "index": null,
        "tag": "h4",
        "length": 15
      },
      {
        "slot": "item",
        "index": 0,
        "tag": "li",
        "length": 6
      },
      {
        "slot": "item",
        "index": 1,
        "tag": "li",
        "length": 13
      },
      {
        "slot": "item",
        "index": 2,
        "tag": "li",
        "length": 14
      },
      {
        "slot": "item",
        "index": 3,
        "tag": "li",
        "length": 7
      },
      {
        "slot": "item",
        "index": 4,
        "tag": "li",
        "length": 18
      },
      {
        "slot": "item",
        "index": 5,
        "tag": "li",
        "length": 3
      },
      {
        "slot": "item",
        "index": 6,
        "tag": "li",
        "length": 11
      },
      {
        "slot": "item",
        "index": 7,
        "tag": "li",
        "length": 4
      },
      {
        "slot": "item",
        "index": 8,
        "tag": "li",
        "length": 6
      },
      {
        "slot": "item",
        "index": 9,
        "tag": "li",
        "length": 3
      },
      {
        "slot": "item",
        "index": 10,
        "tag": "li",
        "length": 9
      },
      {
        "slot": "item",
        "index": 11,
        "tag": "li",
        "length": 3
      },
      {
        "slot": "item",
        "index": 12,
        "tag": "li",
        "length": 7
      },
      {
        "slot": "item",
        "index": 13,
        "tag": "li",
        "length": 8
      }
    ]
  },
  {
    "id": "description-16",
    "name": "وصف المنتج 16",
    "advanced": true,
    "controlColors": [
      "#ffffff"
    ],
    "verticalLocked": true,
    "count": 4,
    "hasImage": true,
    "purchase": false,
    "reversed": true,
    "preview": {
      "width": 395,
      "height": 654
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
          "tag": "h4",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 18,
                  "slot": "title"
                }
              ],
              "style": "white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        },
        {
          "tag": "h2",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 58,
                  "slot": "description"
                }
              ],
              "style": "white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        },
        {
          "tag": "ul",
          "children": [
            {
              "tag": "li",
              "children": [
                {
                  "tag": "span",
                  "children": [
                    {
                      "length": 43,
                      "slot": "item",
                      "index": 0
                    }
                  ],
                  "style": "white-space: pre-wrap"
                }
              ],
              "style": "text-align: right"
            },
            {
              "tag": "li",
              "children": [
                {
                  "tag": "span",
                  "children": [
                    {
                      "length": 33,
                      "slot": "item",
                      "index": 1
                    }
                  ],
                  "style": "white-space: pre-wrap"
                }
              ],
              "style": "text-align: right"
            },
            {
              "tag": "li",
              "children": [
                {
                  "tag": "span",
                  "children": [
                    {
                      "length": 26,
                      "slot": "item",
                      "index": 2
                    }
                  ],
                  "style": "white-space: pre-wrap"
                }
              ],
              "style": "text-align: right"
            },
            {
              "tag": "li",
              "children": [
                {
                  "tag": "span",
                  "children": [
                    {
                      "length": 33,
                      "slot": "item",
                      "index": 3
                    }
                  ],
                  "style": "white-space: pre-wrap"
                }
              ],
              "style": "text-align: right"
            }
          ],
          "repeat": true
        }
      ]
    },
    "slots": [
      {
        "slot": "title",
        "index": null,
        "tag": "h4",
        "length": 18
      },
      {
        "slot": "description",
        "index": null,
        "tag": "h2",
        "length": 58
      },
      {
        "slot": "item",
        "index": 0,
        "tag": "li",
        "length": 43
      },
      {
        "slot": "item",
        "index": 1,
        "tag": "li",
        "length": 33
      },
      {
        "slot": "item",
        "index": 2,
        "tag": "li",
        "length": 26
      },
      {
        "slot": "item",
        "index": 3,
        "tag": "li",
        "length": 33
      }
    ]
  },
  {
    "id": "description-17",
    "name": "وصف المنتج 17",
    "advanced": true,
    "controlColors": [
      "#ffffff"
    ],
    "verticalLocked": true,
    "count": 2,
    "hasImage": true,
    "purchase": false,
    "reversed": true,
    "preview": {
      "width": 395,
      "height": 769
    },
    "ratios": [
      [
        900,
        691
      ]
    ],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h4",
          "children": [
            {
              "length": 8,
              "slot": "title"
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h2",
          "children": [
            {
              "length": 81,
              "slot": "description"
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h4",
          "children": [
            {
              "length": 10,
              "slot": "item",
              "index": 0,
              "field": "title"
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h2",
          "children": [
            {
              "length": 80,
              "slot": "item",
              "index": 0,
              "field": "text"
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h4",
          "children": [
            {
              "length": 9,
              "slot": "item",
              "index": 1,
              "field": "title"
            }
          ],
          "class": "ql-align-right"
        },
        {
          "tag": "h2",
          "children": [
            {
              "length": 71,
              "slot": "item",
              "index": 1,
              "field": "text"
            }
          ],
          "class": "ql-align-right"
        }
      ]
    },
    "slots": [
      {
        "slot": "title",
        "index": null,
        "field": null,
        "length": 8,
        "tag": "h4"
      },
      {
        "slot": "description",
        "index": null,
        "field": null,
        "length": 81,
        "tag": "h2"
      },
      {
        "slot": "item",
        "index": 0,
        "field": "title",
        "length": 10,
        "tag": "h4"
      },
      {
        "slot": "item",
        "index": 0,
        "field": "text",
        "length": 80,
        "tag": "h2"
      },
      {
        "slot": "item",
        "index": 1,
        "field": "title",
        "length": 9,
        "tag": "h4"
      },
      {
        "slot": "item",
        "index": 1,
        "field": "text",
        "length": 71,
        "tag": "h2"
      }
    ]
  },
  {
    "id": "description-18",
    "name": "وصف المنتج 18",
    "advanced": true,
    "controlColors": [
      "#ffffff"
    ],
    "verticalLocked": false,
    "count": 10,
    "hasImage": false,
    "purchase": false,
    "reversed": true,
    "preview": {
      "width": 391,
      "height": 702
    },
    "ratios": [],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h4",
          "children": [
            {
              "length": 16,
              "slot": "title"
            }
          ]
        },
        {
          "tag": "ul",
          "children": [
            {
              "tag": "li",
              "children": [
                {
                  "length": 19,
                  "slot": "item",
                  "index": 0
                }
              ]
            },
            {
              "tag": "li",
              "children": [
                {
                  "length": 128,
                  "slot": "item",
                  "index": 1
                }
              ]
            }
          ]
        },
        {
          "tag": "ol",
          "children": [
            {
              "tag": "li",
              "children": [
                {
                  "length": 37,
                  "slot": "item",
                  "index": 2
                }
              ],
              "class": "ql-indent-1"
            },
            {
              "tag": "li",
              "children": [
                {
                  "length": 114,
                  "slot": "item",
                  "index": 3
                }
              ],
              "class": "ql-indent-1"
            }
          ]
        },
        {
          "tag": "ul",
          "children": [
            {
              "tag": "li",
              "children": [
                {
                  "length": 45,
                  "slot": "item",
                  "index": 4
                }
              ],
              "class": "ql-indent-1"
            },
            {
              "tag": "li",
              "children": [
                {
                  "length": 83,
                  "slot": "item",
                  "index": 5
                }
              ],
              "class": "ql-indent-1"
            }
          ]
        },
        {
          "tag": "ol",
          "children": [
            {
              "tag": "li",
              "children": [
                {
                  "length": 6,
                  "slot": "item",
                  "index": 6
                }
              ],
              "class": "ql-indent-1"
            },
            {
              "tag": "li",
              "children": [
                {
                  "length": 5,
                  "slot": "item",
                  "index": 7
                }
              ],
              "class": "ql-indent-1"
            }
          ]
        },
        {
          "tag": "ul",
          "children": [
            {
              "tag": "li",
              "children": [
                {
                  "length": 5,
                  "slot": "item",
                  "index": 8
                }
              ],
              "class": "ql-indent-1"
            },
            {
              "tag": "li",
              "children": [
                {
                  "length": 9,
                  "slot": "item",
                  "index": 9
                }
              ],
              "class": "ql-indent-1"
            }
          ],
          "repeat": true
        }
      ]
    },
    "slots": [
      {
        "slot": "title",
        "index": null,
        "tag": "h4",
        "length": 16
      },
      {
        "slot": "item",
        "index": 0,
        "tag": "li",
        "length": 19
      },
      {
        "slot": "item",
        "index": 1,
        "tag": "li",
        "length": 128
      },
      {
        "slot": "item",
        "index": 2,
        "tag": "li",
        "length": 37
      },
      {
        "slot": "item",
        "index": 3,
        "tag": "li",
        "length": 114
      },
      {
        "slot": "item",
        "index": 4,
        "tag": "li",
        "length": 45
      },
      {
        "slot": "item",
        "index": 5,
        "tag": "li",
        "length": 83
      },
      {
        "slot": "item",
        "index": 6,
        "tag": "li",
        "length": 6
      },
      {
        "slot": "item",
        "index": 7,
        "tag": "li",
        "length": 5
      },
      {
        "slot": "item",
        "index": 8,
        "tag": "li",
        "length": 5
      },
      {
        "slot": "item",
        "index": 9,
        "tag": "li",
        "length": 9
      }
    ]
  },
  {
    "id": "description-19",
    "name": "وصف المنتج 19",
    "advanced": true,
    "controlColors": [
      "#ffffff"
    ],
    "verticalLocked": false,
    "count": 3,
    "hasImage": true,
    "purchase": false,
    "reversed": false,
    "preview": {
      "width": 395,
      "height": 571
    },
    "ratios": [
      [
        900,
        600
      ]
    ],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h4",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 16,
                  "slot": "title"
                }
              ],
              "style": "white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        },
        {
          "tag": "ul",
          "children": [
            {
              "tag": "li",
              "children": [
                {
                  "tag": "span",
                  "children": [
                    {
                      "length": 110,
                      "slot": "item",
                      "index": 0
                    }
                  ],
                  "style": "white-space: pre-wrap"
                }
              ],
              "style": "text-align: right"
            },
            {
              "tag": "li",
              "children": [
                {
                  "tag": "span",
                  "children": [
                    {
                      "length": 119,
                      "slot": "item",
                      "index": 1
                    }
                  ],
                  "style": "white-space: pre-wrap"
                }
              ],
              "style": "text-align: right"
            },
            {
              "tag": "li",
              "children": [
                {
                  "tag": "span",
                  "children": [
                    {
                      "length": 39,
                      "slot": "item",
                      "index": 2
                    }
                  ],
                  "style": "white-space: pre-wrap"
                }
              ],
              "style": "text-align: right"
            }
          ],
          "repeat": true
        }
      ]
    },
    "slots": [
      {
        "slot": "title",
        "index": null,
        "tag": "h4",
        "length": 16
      },
      {
        "slot": "item",
        "index": 0,
        "tag": "li",
        "length": 110
      },
      {
        "slot": "item",
        "index": 1,
        "tag": "li",
        "length": 119
      },
      {
        "slot": "item",
        "index": 2,
        "tag": "li",
        "length": 39
      }
    ]
  },
  {
    "id": "description-20",
    "name": "وصف المنتج 20",
    "advanced": true,
    "controlColors": [
      "#ffffff"
    ],
    "verticalLocked": false,
    "count": 3,
    "hasImage": true,
    "purchase": false,
    "reversed": false,
    "preview": {
      "width": 397,
      "height": 791
    },
    "ratios": [
      [
        800,
        1174
      ]
    ],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h1",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 26,
                  "slot": "title"
                }
              ],
              "style": "white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        },
        {
          "tag": "h3",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 212,
                  "slot": "description"
                }
              ],
              "style": "white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        },
        {
          "tag": "h4",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 21,
                  "slot": "item",
                  "index": 0,
                  "field": "title"
                }
              ],
              "style": "white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        },
        {
          "tag": "h2",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 40,
                  "slot": "item",
                  "index": 0,
                  "field": "text"
                }
              ],
              "style": "white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        },
        {
          "tag": "h4",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 11,
                  "slot": "item",
                  "index": 1,
                  "field": "title"
                }
              ],
              "style": "white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        },
        {
          "tag": "h2",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 40,
                  "slot": "item",
                  "index": 1,
                  "field": "text"
                }
              ],
              "style": "white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        },
        {
          "tag": "h4",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 16,
                  "slot": "item",
                  "index": 2,
                  "field": "title"
                }
              ],
              "style": "white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        },
        {
          "tag": "h2",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 40,
                  "slot": "item",
                  "index": 2,
                  "field": "text"
                }
              ],
              "style": "white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        }
      ]
    },
    "slots": [
      {
        "slot": "title",
        "index": null,
        "field": null,
        "length": 26,
        "tag": "h1"
      },
      {
        "slot": "description",
        "index": null,
        "field": null,
        "length": 212,
        "tag": "h3"
      },
      {
        "slot": "item",
        "index": 0,
        "field": "title",
        "length": 21,
        "tag": "h4"
      },
      {
        "slot": "item",
        "index": 0,
        "field": "text",
        "length": 40,
        "tag": "h2"
      },
      {
        "slot": "item",
        "index": 1,
        "field": "title",
        "length": 11,
        "tag": "h4"
      },
      {
        "slot": "item",
        "index": 1,
        "field": "text",
        "length": 40,
        "tag": "h2"
      },
      {
        "slot": "item",
        "index": 2,
        "field": "title",
        "length": 16,
        "tag": "h4"
      },
      {
        "slot": "item",
        "index": 2,
        "field": "text",
        "length": 40,
        "tag": "h2"
      }
    ]
  },
  {
    "id": "description-21",
    "name": "وصف المنتج 21",
    "advanced": true,
    "controlColors": [
      "#ffffff"
    ],
    "verticalLocked": false,
    "count": 3,
    "hasImage": true,
    "purchase": false,
    "reversed": false,
    "preview": {
      "width": 396,
      "height": 850
    },
    "ratios": [
      [
        900,
        1101
      ]
    ],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h1",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 15,
                  "slot": "title"
                }
              ],
              "style": "white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        },
        {
          "tag": "h4",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 13,
                  "slot": "item",
                  "index": 0,
                  "field": "title"
                }
              ],
              "style": "white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        },
        {
          "tag": "h2",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 26,
                  "slot": "item",
                  "index": 0,
                  "field": "text"
                }
              ],
              "style": "white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        },
        {
          "tag": "h4",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 14,
                  "slot": "item",
                  "index": 1,
                  "field": "title"
                }
              ],
              "style": "white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        },
        {
          "tag": "h2",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 79,
                  "slot": "item",
                  "index": 1,
                  "field": "text"
                }
              ],
              "style": "white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        },
        {
          "tag": "h4",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 14,
                  "slot": "item",
                  "index": 2,
                  "field": "title"
                }
              ],
              "style": "white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        },
        {
          "tag": "h2",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 85,
                  "slot": "item",
                  "index": 2,
                  "field": "text"
                }
              ],
              "style": "white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        }
      ]
    },
    "slots": [
      {
        "slot": "title",
        "index": null,
        "field": null,
        "length": 15,
        "tag": "h1"
      },
      {
        "slot": "item",
        "index": 0,
        "field": "title",
        "length": 13,
        "tag": "h4"
      },
      {
        "slot": "item",
        "index": 0,
        "field": "text",
        "length": 26,
        "tag": "h2"
      },
      {
        "slot": "item",
        "index": 1,
        "field": "title",
        "length": 14,
        "tag": "h4"
      },
      {
        "slot": "item",
        "index": 1,
        "field": "text",
        "length": 79,
        "tag": "h2"
      },
      {
        "slot": "item",
        "index": 2,
        "field": "title",
        "length": 14,
        "tag": "h4"
      },
      {
        "slot": "item",
        "index": 2,
        "field": "text",
        "length": 85,
        "tag": "h2"
      }
    ]
  },
  {
    "id": "description-22",
    "name": "وصف المنتج 22",
    "advanced": true,
    "controlColors": [
      "#ffffff"
    ],
    "verticalLocked": false,
    "count": 10,
    "hasImage": false,
    "purchase": false,
    "reversed": true,
    "preview": {
      "width": 395,
      "height": 690
    },
    "ratios": [],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h4",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 16,
                  "slot": "title"
                }
              ],
              "style": "color: rgb(236, 236, 236); white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        },
        {
          "tag": "ul",
          "children": [
            {
              "tag": "li",
              "children": [
                {
                  "tag": "span",
                  "children": [
                    {
                      "length": 25,
                      "slot": "item",
                      "index": 0
                    }
                  ],
                  "style": "white-space: pre-wrap"
                }
              ],
              "style": "text-align: right"
            },
            {
              "tag": "li",
              "children": [
                {
                  "tag": "span",
                  "children": [
                    {
                      "length": 112,
                      "slot": "item",
                      "index": 1
                    }
                  ],
                  "style": "white-space: pre-wrap"
                }
              ],
              "style": "text-align: right"
            }
          ]
        },
        {
          "tag": "ol",
          "children": [
            {
              "tag": "li",
              "children": [
                {
                  "tag": "span",
                  "children": [
                    {
                      "length": 37,
                      "slot": "item",
                      "index": 2
                    }
                  ],
                  "style": "white-space: pre-wrap"
                }
              ],
              "style": "text-align: right"
            },
            {
              "tag": "li",
              "children": [
                {
                  "tag": "span",
                  "children": [
                    {
                      "length": 84,
                      "slot": "item",
                      "index": 3
                    }
                  ],
                  "style": "white-space: pre-wrap"
                }
              ],
              "style": "text-align: right"
            }
          ]
        },
        {
          "tag": "ul",
          "children": [
            {
              "tag": "li",
              "children": [
                {
                  "tag": "span",
                  "children": [
                    {
                      "length": 31,
                      "slot": "item",
                      "index": 4
                    }
                  ],
                  "style": "white-space: pre-wrap"
                }
              ],
              "style": "text-align: right"
            },
            {
              "tag": "li",
              "children": [
                {
                  "tag": "span",
                  "children": [
                    {
                      "length": 81,
                      "slot": "item",
                      "index": 5
                    }
                  ],
                  "style": "white-space: pre-wrap"
                }
              ],
              "style": "text-align: right"
            }
          ]
        },
        {
          "tag": "ol",
          "children": [
            {
              "tag": "li",
              "children": [
                {
                  "tag": "span",
                  "children": [
                    {
                      "length": 6,
                      "slot": "item",
                      "index": 6
                    }
                  ],
                  "style": "white-space: pre-wrap"
                }
              ],
              "style": "text-align: right"
            },
            {
              "tag": "li",
              "children": [
                {
                  "tag": "span",
                  "children": [
                    {
                      "length": 5,
                      "slot": "item",
                      "index": 7
                    }
                  ],
                  "style": "white-space: pre-wrap"
                }
              ],
              "style": "text-align: right"
            }
          ]
        },
        {
          "tag": "ul",
          "children": [
            {
              "tag": "li",
              "children": [
                {
                  "tag": "span",
                  "children": [
                    {
                      "length": 5,
                      "slot": "item",
                      "index": 8
                    }
                  ],
                  "style": "white-space: pre-wrap"
                }
              ],
              "style": "text-align: right"
            },
            {
              "tag": "li",
              "children": [
                {
                  "tag": "span",
                  "children": [
                    {
                      "length": 9,
                      "slot": "item",
                      "index": 9
                    }
                  ],
                  "style": "white-space: pre-wrap"
                }
              ],
              "style": "text-align: right"
            }
          ],
          "repeat": true
        }
      ]
    },
    "slots": [
      {
        "slot": "title",
        "index": null,
        "tag": "h4",
        "length": 16
      },
      {
        "slot": "item",
        "index": 0,
        "tag": "li",
        "length": 25
      },
      {
        "slot": "item",
        "index": 1,
        "tag": "li",
        "length": 112
      },
      {
        "slot": "item",
        "index": 2,
        "tag": "li",
        "length": 37
      },
      {
        "slot": "item",
        "index": 3,
        "tag": "li",
        "length": 84
      },
      {
        "slot": "item",
        "index": 4,
        "tag": "li",
        "length": 31
      },
      {
        "slot": "item",
        "index": 5,
        "tag": "li",
        "length": 81
      },
      {
        "slot": "item",
        "index": 6,
        "tag": "li",
        "length": 6
      },
      {
        "slot": "item",
        "index": 7,
        "tag": "li",
        "length": 5
      },
      {
        "slot": "item",
        "index": 8,
        "tag": "li",
        "length": 5
      },
      {
        "slot": "item",
        "index": 9,
        "tag": "li",
        "length": 9
      }
    ]
  },
  {
    "id": "description-23",
    "name": "وصف المنتج 23",
    "advanced": true,
    "controlColors": [
      "#141414"
    ],
    "verticalLocked": false,
    "count": 2,
    "hasImage": true,
    "purchase": false,
    "reversed": false,
    "preview": {
      "width": 394,
      "height": 718
    },
    "ratios": [
      [
        900,
        641
      ]
    ],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h4",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 8,
                  "slot": "title"
                }
              ],
              "style": "color: rgb(255, 255, 255); white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        },
        {
          "tag": "h2",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 63,
                  "slot": "description"
                }
              ],
              "style": "color: rgb(255, 255, 255); white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        },
        {
          "tag": "h4",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 11,
                  "slot": "item",
                  "index": 0,
                  "field": "title"
                }
              ],
              "style": "color: rgb(255, 255, 255); white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        },
        {
          "tag": "h2",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 73,
                  "slot": "item",
                  "index": 0,
                  "field": "text"
                }
              ],
              "style": "color: rgb(255, 255, 255); white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        },
        {
          "tag": "h4",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 9,
                  "slot": "item",
                  "index": 1,
                  "field": "title"
                }
              ],
              "style": "color: rgb(255, 255, 255); white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        },
        {
          "tag": "h2",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 65,
                  "slot": "item",
                  "index": 1,
                  "field": "text"
                }
              ],
              "style": "color: rgb(255, 255, 255); white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        }
      ]
    },
    "slots": [
      {
        "slot": "title",
        "index": null,
        "field": null,
        "length": 8,
        "tag": "h4"
      },
      {
        "slot": "description",
        "index": null,
        "field": null,
        "length": 63,
        "tag": "h2"
      },
      {
        "slot": "item",
        "index": 0,
        "field": "title",
        "length": 11,
        "tag": "h4"
      },
      {
        "slot": "item",
        "index": 0,
        "field": "text",
        "length": 73,
        "tag": "h2"
      },
      {
        "slot": "item",
        "index": 1,
        "field": "title",
        "length": 9,
        "tag": "h4"
      },
      {
        "slot": "item",
        "index": 1,
        "field": "text",
        "length": 65,
        "tag": "h2"
      }
    ]
  },
  {
    "id": "description-24",
    "name": "وصف المنتج 24",
    "advanced": true,
    "controlColors": [
      "#ffffff"
    ],
    "verticalLocked": true,
    "count": 4,
    "hasImage": true,
    "purchase": false,
    "reversed": true,
    "preview": {
      "width": 397,
      "height": 335
    },
    "ratios": [
      [
        900,
        882
      ]
    ],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h4",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 5,
                  "slot": "title"
                }
              ],
              "style": "white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        },
        {
          "tag": "h2",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 150,
                  "slot": "description"
                }
              ],
              "style": "white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        },
        {
          "tag": "ul",
          "children": [
            {
              "tag": "li",
              "children": [
                {
                  "tag": "span",
                  "children": [
                    {
                      "length": 12,
                      "slot": "item",
                      "index": 0
                    }
                  ],
                  "style": "white-space: pre-wrap"
                }
              ],
              "style": "text-align: right"
            },
            {
              "tag": "li",
              "children": [
                {
                  "tag": "span",
                  "children": [
                    {
                      "length": 11,
                      "slot": "item",
                      "index": 1
                    }
                  ],
                  "style": "white-space: pre-wrap"
                }
              ],
              "style": "text-align: right"
            },
            {
              "tag": "li",
              "children": [
                {
                  "tag": "span",
                  "children": [
                    {
                      "length": 16,
                      "slot": "item",
                      "index": 2
                    }
                  ],
                  "style": "white-space: pre-wrap"
                }
              ],
              "style": "text-align: right"
            },
            {
              "tag": "li",
              "children": [
                {
                  "tag": "span",
                  "children": [
                    {
                      "length": 13,
                      "slot": "item",
                      "index": 3
                    }
                  ],
                  "style": "white-space: pre-wrap"
                }
              ],
              "style": "text-align: right"
            }
          ],
          "repeat": true
        }
      ]
    },
    "slots": [
      {
        "slot": "title",
        "index": null,
        "tag": "h4",
        "length": 5
      },
      {
        "slot": "description",
        "index": null,
        "tag": "h2",
        "length": 150
      },
      {
        "slot": "item",
        "index": 0,
        "tag": "li",
        "length": 12
      },
      {
        "slot": "item",
        "index": 1,
        "tag": "li",
        "length": 11
      },
      {
        "slot": "item",
        "index": 2,
        "tag": "li",
        "length": 16
      },
      {
        "slot": "item",
        "index": 3,
        "tag": "li",
        "length": 13
      }
    ]
  },
  {
    "id": "description-25",
    "name": "وصف المنتج 25",
    "advanced": true,
    "controlColors": [
      "#ffffff"
    ],
    "verticalLocked": false,
    "count": 1,
    "hasImage": true,
    "purchase": false,
    "reversed": false,
    "preview": {
      "width": 396,
      "height": 834
    },
    "ratios": [
      [
        1161,
        1400
      ]
    ],
    "schema": {
      "tag": "div",
      "children": [
        {
          "tag": "h2",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 19,
                  "slot": "title"
                }
              ],
              "style": "white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        },
        {
          "tag": "h3",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 27,
                  "slot": "description"
                }
              ],
              "style": "white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        },
        {
          "tag": "h1",
          "children": [
            {
              "tag": "span",
              "children": [
                {
                  "length": 366,
                  "slot": "item",
                  "index": 0
                }
              ],
              "style": "white-space: pre-wrap"
            }
          ],
          "style": "text-align: right"
        }
      ]
    },
    "slots": [
      {
        "slot": "title",
        "index": null,
        "tag": "h2",
        "length": 19
      },
      {
        "slot": "description",
        "index": null,
        "tag": "h3",
        "length": 27
      },
      {
        "slot": "item",
        "index": 0,
        "tag": "h1",
        "length": 366
      }
    ]
  }
] as const;
export const descriptionDesign = (id?:string) => descriptionDesigns.find(d=>d.id===id)??descriptionDesigns[0];
export const descriptionDefaults = (id:DescriptionVariant):Partial<LandingSettings> => ({variant:id});
