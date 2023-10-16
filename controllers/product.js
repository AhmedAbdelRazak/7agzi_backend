/** @format */

const Product = require("../models/product");
const User = require("../models/user");
const mongoose = require("mongoose");

exports.productById = (req, res, next, id) => {
	Product.findById(id)
		.populate("ratings.ratedBy", "_id name email")
		.populate("comments.postedBy", "_id name email")
		.populate(
			"subcategory",
			"_id SubcategoryName SubcategorySlug subCategoryStatus"
		)
		.populate("category", "_id categoryName categorySlug")
		.populate(
			"relatedProducts",
			"_id productName productName_Arabic productSKU slug slug_Arabic price priceAfterDiscount quantity images activeProduct category subcategory"
		)
		.exec((err, product) => {
			if (err || !product) {
				return res.status(400).json({
					error: "Product not found",
				});
			}
			req.product = product;
			next();
		});
};

exports.read = (req, res) => {
	return res.json(req.product);
};

exports.create = async (req, res) => {
	try {
		const newProduct = await new Product(req.body).save();
		// console.log(req.body, "create a product");
		res.json(newProduct);
	} catch (err) {
		console.log(err, "Error while creating a Product");
		res.status(400).send("Product error during creation");
	}
};

exports.listProductsNoFilter = (req, res) => {
	const userId = mongoose.Types.ObjectId(req.params.userId);

	Product.find({ belongsTo: userId })
		.populate("category", "_id categoryName categorySlug")
		.populate(
			"relatedProducts",
			"_id productName productName_Arabic productSKU slug slug_Arabic price priceAfterDiscount quantity images activeProduct category subcategory"
		)
		.exec((err, data) => {
			if (err) {
				console.log(err);
				return res.status(400).json({
					error: err,
				});
			}
			res.json(data);
		});
};

exports.update = (req, res) => {
	const product = req.product;
	product.productName = req.body.product.productName;
	product.productName_Arabic = req.body.product.productName_Arabic;
	product.slug = req.body.product.slug;
	product.slug_Arabic = req.body.product.slug_Arabic;
	product.description1 = req.body.product.description1;
	product.description1_Arabic = req.body.product.description1_Arabic;
	product.description2 = req.body.product.description2;
	product.description2_Arabic = req.body.product.description2_Arabic;
	product.description3 = req.body.product.description3;
	product.price = req.body.product.price;
	product.priceAfterDiscount = req.body.product.priceAfterDiscount;
	product.price_unit = req.body.product.price_unit;
	product.quantity = req.body.product.quantity;
	product.category = req.body.product.category;
	product.images = req.body.product.images;
	product.shipping = req.body.product.shipping;
	product.activeProduct = req.body.product.activeProduct;
	product.featuredProduct = req.body.product.featuredProduct;
	product.productSKU = req.body.product.productSKU;
	product.loyaltyPoints = req.body.product.loyaltyPoints;
	product.relatedProducts = req.body.product.relatedProducts;
	product.gender = req.body.product.gender;
	product.save((err, data) => {
		if (err) {
			return res.status(400).json({
				error: err,
			});
		}
		res.json(data);
	});
};

exports.listRelated = (req, res) => {
	let limit = req.query.limit ? parseInt(req.query.limit) : 10;
	let sortBy = req.body.sortBy ? req.body.sortBy : "viewsCount";

	Product.find({ _id: { $ne: req.product }, category: req.product.category })
		.select("-photo -photo2 -photo3 -photo4 -photo5")
		.limit(limit)
		.populate("category", "_id name")
		.populate(
			"subcategory",
			"_id SubcategoryName SubcategorySlug subCategoryStatus"
		)
		.exec((err, products) => {
			if (err) {
				return res.status(400).json({
					error: "products not found",
				});
			}
			res.json(products);
		});
};

exports.listCategories = (req, res) => {
	Product.distinct("category", {}, (err, categories) => {
		if (err) {
			return res.status(400).json({
				error: "categories not found",
			});
		}
		res.json(categories);
	});
};

exports.list = (req, res) => {
	let order = req.query.order ? req.query.order : "desc";
	let sortBy = req.query.sortBy ? req.query.sortBy : "viewsCount";
	let limit = req.query.limit ? parseInt(req.query.limit) : 10;
	const userId = mongoose.Types.ObjectId(req.params.userId);

	Product.find({ belongsTo: userId })
		.populate("category", "_id categoryName categorySlug")
		.populate("comments", "text created")
		.populate("comments.postedBy", "_id name email")
		.populate(
			"subcategory",
			"_id SubcategoryName SubcategorySlug subCategoryStatus"
		)
		.populate(
			"relatedProducts",
			"_id productName productName_Arabic productSKU slug slug_Arabic price priceAfterDiscount quantity images activeProduct category subcategory"
		)
		.sort([[sortBy, order]])
		.limit(limit)
		.exec((err, products) => {
			if (err) {
				return res.status(400).json({
					err: "products not found",
				});
			}
			res.json(products);
		});
};

exports.listBySearch = (req, res) => {
	let order = req.body.order ? req.body.order : "desc";
	let sortBy = req.body.sortBy ? req.body.sortBy : "_id";
	let findArgs = {};

	// console.log(order, sortBy, limit, skip, req.body.filters);
	// console.log("findArgs", findArgs);

	for (let key in req.body.filters) {
		if (req.body.filters[key].length > 0) {
			if (key === "price") {
				// gte -  greater than price [0-10]
				// lte - less than
				findArgs[key] = {
					$gte: req.body.filters[key][0],
					$lte: req.body.filters[key][1],
				};
			} else {
				findArgs[key] = req.body.filters[key];
			}
		}
	}

	Product.find(findArgs)
		.populate("category", "_id categoryName categorySlug")
		.populate(
			"subcategory",
			"_id SubcategoryName SubcategorySlug subCategoryStatus"
		)
		.populate(
			"relatedProducts",
			"_id productName productName_Arabic productSKU slug slug_Arabic price priceAfterDiscount quantity images activeProduct category subcategory"
		)
		.sort([[sortBy, order]])
		.exec((err, data) => {
			if (err) {
				return res.status(400).json({
					error: "Products not found",
				});
			}
			res.json({
				size: data.length,
				data,
			});
		});
};

exports.listSearch = (req, res) => {
	// create query object to hold search value and category value
	const query = {};
	// assign search value to query.name
	console.log(req.query.search, "search");
	if (req.query.search) {
		query.productName = { $regex: req.query.search, $options: "i" };
		console.log(query.name, "query name");
		// assigne category value to query.category
		if (req.query.category && req.query.category != "All") {
			query.category = req.query.category;
		}
		// find the product based on query object with 2 properties
		// search and category
		console.log(query, "all the query");
		Product.find(query, (err, products) => {
			if (err) {
				return res.status(400).json({
					error: errorHandler(err),
				});
			}
			res.json(products);
		}).select("-photo -photo2 -photo3 -photo4 -photo5");
	}
};

exports.like = (req, res) => {
	Product.findByIdAndUpdate(
		req.body.productId,
		{ $push: { likes: req.body.userId } },
		{ new: true }
	).exec((err, result) => {
		if (err) {
			return res.status(400).json({
				error: err,
			});
		} else {
			res.json(result);
		}
	});
};

exports.unlike = (req, res) => {
	Product.findByIdAndUpdate(
		req.body.productId,
		{ $pull: { likes: req.body.userId } },
		{ new: true }
	).exec((err, result) => {
		if (err) {
			return res.status(400).json({
				error: err,
			});
		} else {
			res.json(result);
		}
	});
};

exports.viewsCounter = (req, res) => {
	let counter = req.body.counter;
	Product.findByIdAndUpdate(req.body.productId, { viewsCount: counter }).exec(
		(err, result) => {
			if (err) {
				return res.status(400).json({
					error: err,
				});
			} else {
				res.json(result);
			}
		}
	);
};

exports.viewsByUser = (req, res) => {
	var currentdate = new Date();
	var datetime =
		currentdate.getDate() +
		"/" +
		(currentdate.getMonth() + 1) +
		"/" +
		currentdate.getFullYear() +
		" " +
		currentdate.getHours() +
		":" +
		currentdate.getMinutes() +
		":" +
		currentdate.getSeconds();

	Product.findByIdAndUpdate(
		req.body.productId,
		{ $push: { views: datetime } },
		{ new: true }
	).exec((err, result) => {
		if (err) {
			return res.status(400).json({
				error: err,
			});
		} else {
			res.json(result);
		}
	});
};

exports.comment = (req, res) => {
	let comment = req.body.comment;
	comment.postedBy = req.body.userId;
	// console.log(req.body, "comments");
	Product.findByIdAndUpdate(
		req.body.productId,
		{ $push: { comments: comment } },
		{ new: true }
	)
		.populate("comments.postedBy", "_id name email")
		// .populate("postedBy", "_id name email")
		.exec((err, result) => {
			if (err) {
				return res.status(400).json({
					error: err,
				});
			} else {
				res.json(result);
			}
		});
};

exports.uncomment = (req, res) => {
	let comment = req.body.comment;

	Product.findByIdAndUpdate(
		req.body.productId,
		{ $pull: { comments: { _id: comment._id } } },
		{ new: true }
	)
		.populate("comments.postedBy", "_id name email")
		// .populate("postedBy", "_id name email")
		.exec((err, result) => {
			if (err) {
				return res.status(400).json({
					error: err,
				});
			} else {
				res.json(result);
			}
		});
};

exports.productStar = async (req, res) => {
	const product = await Product.findById(req.params.productId).exec();
	const user = await User.findById(req.body.userId).exec();
	const { star } = req.body;

	// who is updating?
	// check if currently logged in user have already added rating to this Product?
	let existingRatingObject = product.ratings.find(
		(ele) => ele.ratedBy.toString() === user._id.toString()
	);

	// if user haven't left rating yet, push it
	if (existingRatingObject === undefined) {
		let ratingAdded = await Product.findByIdAndUpdate(
			product._id,
			{
				$push: { ratings: { star, ratedBy: user._id } },
			},
			{ new: true }
		).exec();
		// console.log("ratingAdded", ratingAdded);
		res.json(ratingAdded);
	} else {
		// if user have already left rating, update it
		const ratingUpdated = await Product.updateOne(
			{
				ratings: { $elemMatch: existingRatingObject },
			},
			{ $set: { "ratings.$.star": star } },
			{ new: true }
		).exec();
		// console.log("ratingUpdated", ratingUpdated);
		res.json(ratingUpdated);
	}
};

exports.decreaseQuantity = (req, res, next) => {
	let bulkOps = req.body.order.products.map((item) => {
		// console.log(item, "from decrease qty");
		// console.log(item.id, "from decrease qty");
		// console.log(-item.amount + 2, "from decrease qty");
		// console.log(+item.amount + 0, "from decrease qty");
		return {
			updateOne: {
				filter: { _id: item.id },
				update: { $inc: { quantity: -item.amount, sold: +item.amount } },
			},
		};
	});

	Product.bulkWrite(bulkOps, {}, (error, products) => {
		if (error) {
			return res.status(400).json({
				error: "Could not update product",
			});
		}
		next();
	});
};
