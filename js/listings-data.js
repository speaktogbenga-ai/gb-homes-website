/* ==========================================================================
   GB Homes — listings
   --------------------------------------------------------------------------
   To add a listing, copy one block below, paste it at the top of the list and
   change the details. To show photos, put them in assets/listings/ and list
   the file names in `photos` (the first photo is the cover).

   status:  "For sale", "New", "Sold", "Conditionally sold" or "Leased"
   type:    "Detached", "Semi-detached", "Townhouse", "Condo" or "Multiplex"
   price:   a number with no $ or commas, or null to show "Contact for price"
   ========================================================================== */
window.GB_LISTINGS = [
  {
    id: "pickering-3-bed-semi",
    status: "New",
    type: "Semi-detached",
    title: "3-bedroom semi-detached home",
    address: "",                 // street address, e.g. "123 Example Cres."
    city: "Pickering",
    province: "ON",
    price: null,
    beds: 3,
    baths: null,                 // e.g. 2.5
    parking: null,               // e.g. 2
    sqft: "",                    // e.g. "1,500–2,000"
    mlsNumber: "",
    photos: [],                  // e.g. ["pickering-front.jpg", "pickering-kitchen.jpg"]
    featured: true,
    goodFor: ["First-time buyers", "Families", "Investors"],
    summary:
      "A 3-bedroom semi-detached home in Pickering, with quick access to Highway 401, the GO train and Toronto. A great fit for first-time buyers stepping out of renting, or investors looking at Durham Region.",
    highlights: [
      "3 bedrooms",
      "Semi-detached: more space and privacy than a townhouse, usually for less than a detached home",
      "Pickering location: close to Highway 401 and Pickering GO for commuting to Toronto"
    ]
  }
];
