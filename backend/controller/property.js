const property = require("../model/propertyCollection");
const formDataToObject = require("form-data-to-object");
const RoomTypeCollection = require("../model/RoomtypeCollection");
const aminitiesCollection = require("../model/aminitiesCollection");
const propertyCollection = require("../model/propertyCollection");
const userCollection = require("../model/userCollection");

module.exports = {
  addproperty: async (req, res) => {
    const parsedFormData = formDataToObject.toObj(req.body);

    for (let key in parsedFormData.Facility) {
      let value = parsedFormData.Facility[key];
      parsedFormData.Facility[key] = parseInt(value);
    }

    for (let key in parsedFormData.coordinates) {
      let value = parsedFormData.coordinates[key];
      parsedFormData.coordinates[key] = parseFloat(value);
    }

    let value = parsedFormData["Price"];

    parsedFormData["Price"] = parseInt(value);

    let max = parsedFormData["Maxguest"];

    parsedFormData["Maxguest"] = parseInt(max);

    for (let key in parsedFormData.Amenties) {
      let value = parsedFormData.Amenties[key];
      if (value === "true") {
        parsedFormData.Amenties[key] = true;
      } else {
        parsedFormData.Amenties[key] = false;
      }
    }

    let img = req.files.map((item) => item.location);
    parsedFormData["images"] = img;

    let result = await property.create(parsedFormData);

    res.status(200).send({ img: req.files });
  },
  EditProperty: async (req, res) => {
    const parsedFormData = formDataToObject.toObj(req.body);
    for (let key in parsedFormData.Facility) {
      let value = parsedFormData.Facility[key];
      parsedFormData.Facility[key] = parseInt(value);
    }

    for (let key in parsedFormData.coordinates) {
      let value = parsedFormData.coordinates[key];
      parsedFormData.coordinates[key] = parseFloat(value);
    }

    let value = parsedFormData["Price"];
    parsedFormData["Price"] = parseInt(value);

    let max = parsedFormData["Maxguest"];

    parsedFormData["Maxguest"] = parseInt(max);

    for (let key in parsedFormData.Amenties) {
      let value = parsedFormData.Amenties[key];
      if (value === "true") {
        parsedFormData.Amenties[key] = true;
      } else {
        parsedFormData.Amenties[key] = false;
      }
    }

    if (req.files) {
      let img = req.files.map((item) => item.location);
      if (!parsedFormData.images) {
        parsedFormData.images = [];
      }
      img.forEach((image) => {
        parsedFormData["images"].push(image);
      });
    }

    await propertyCollection.replaceOne(
      { _id: req.body.Proid },
      parsedFormData
    );

    res.sendStatus(200);
  },

  getAllproperty: async (req, res) => {
    let limit = parseInt(req.query.limit)
    let page = parseInt(req.query.page)

    let skip = page * limit;
    let count = await propertyCollection.count()
    try {
      let Property = await property.aggregate([
        { $match: {} },
        {
          $lookup: {
            from: "hostdetails",
            localField: "hostid",
            foreignField: "userid",
            as: "host",
          },
        },
        {
          $addFields: {
            host: { $arrayElemAt: ["$host", 0] },
            wishlist: false,
          },
        },
        { $skip: skip },
        { $limit: limit },
      ])
      res.status(200).json(Property)
    } catch (err) {
      res.status(500).send(err);
    }
  },
  removeProperty: async (req, res) => {
    try {
      await property.deleteOne({ _id: req.params.id });
      res.sendStatus(200);
    } catch (err) {
      res.status(500).send(err);
    }
  },

  addRoomType: async (req, res) => {
    try {
      let img = req.file.location;
      req.body.image = [img];
      await RoomTypeCollection.create(req.body);
      res.sendStatus(200);
    } catch (err) {
      res.sendStatus(403);
    }
  },
  getRoomType: async (req, res) => {
    try {
      let RoomType = await RoomTypeCollection.find({});
      res.status(200).json(RoomType);
    } catch (err) {}
  },
  removeRoomType: async (req, res) => {
    try {
      await RoomTypeCollection.deleteOne({ _id: req.params.id });
      res.sendStatus(200);
    } catch (err) {
      res.status(500).send(err);
    }
  },
  editRoomType: async (req, res) => {
    try {
      let result = await RoomTypeCollection.findOne({ _id: req.body._id });
      if (result) {
        if (req.file) {
          let img = req.file.location;
          req.body.image = [img];
        }
        await RoomTypeCollection.updateOne(
          { _id: req.body._id },
          { $set: req.body }
        );
        res.sendStatus(200);
        return;
      }
      throw new Error();
    } catch (err) {
      res.status(500).send(err);
    }
  },
  addAmenties: async (req, res) => {
    try {
      let img = req.file.location;
      req.body.image = [img];
      await aminitiesCollection.create(req.body);
      res.sendStatus(200);
    } catch (err) {}
  },
  getAmenities: async (req, res) => {
    try {
      let result = await aminitiesCollection.find({});
      res.status(200).json(result);
    } catch (err) {
      res.status(400).send({ message: "not found" });
    }
  },
  removeAmenities: async (req, res) => {
    try {
      await aminitiesCollection.deleteOne({ _id: req.params.id });
      res.sendStatus(200);
    } catch (err) {
      res.status(403).send("error occured");
    }
  },
  editAmenties: async (req, res) => {
    try {
      let result = await aminitiesCollection.findOne({ _id: req.body._id });
      if (result) {
        if (req.file) {
          let img = req.file.location;
          req.body.image = [img];
        }
        await aminitiesCollection.updateOne(
          { _id: req.body._id },
          { $set: req.body }
        );
        res.sendStatus(200);
        return;
      }
      throw new Error();
    } catch (err) {
      res.status(403).send(err);
    }
  },
  searchProperty: async (req, res) => {
    const destination = req.query.destination;
    const startdate = req.query.checkin;
    const endDate = req.query.checkout;
    try {
      let result = await propertyCollection.aggregate([
        { $match: { $text: { $search: destination, $caseSensitive: false } } },
        { $match: { NotAvailable: { $nin: [startdate, endDate] } } },
      ]);
      res.status(200).json(result);
    } catch (err) {
      res.status(200).send(err);
    }
  },
};
