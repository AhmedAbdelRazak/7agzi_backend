const express = require("express");
const router = express.Router();
const { SitemapStream, streamToPromise } = require("sitemap");
const { createWriteStream } = require("fs");
const { resolve } = require("path");
require("dotenv").config();

// Replace with your models
const Employee = require("../models/employee");
const Store = require("../models/storeManagement");

router.get("/generate-sitemap", async (req, res) => {
	let links = [];

	// Fetch data from MongoDB
	const employees = await Employee.find();
	const stores = await Store.find();

	// Get current date
	const currentDate = new Date().toISOString();

	// Add static links
	const staticLinks = [
		{ url: "/", lastmod: currentDate, changefreq: "weekly", priority: 0.8 },
		{
			url: "/schedule",
			lastmod: currentDate,
			changefreq: "weekly",
			priority: 1,
		},
		{
			url: "/about",
			lastmod: currentDate,
			changefreq: "yearly",
			priority: 0.5,
		},
		{
			url: "/contact",
			lastmod: currentDate,
			changefreq: "yearly",
			priority: 0.5,
		},
		{
			url: "/agent-guide",
			lastmod: currentDate,
			changefreq: "monthly",
			priority: 0.5,
		},
		{
			url: "/agents-signup-form2",
			lastmod: currentDate,
			changefreq: "monthly",
			priority: 0.8,
		},
		{
			url: "/signup",
			lastmod: currentDate,
			changefreq: "monthly",
			priority: 1,
		},
		{
			url: "/steps",
			lastmod: currentDate,
			changefreq: "monthly",
			priority: 0.8,
		},
		{
			url: "/register-your-ecommerce-shop",
			lastmod: currentDate,
			changefreq: "monthly",
			priority: 0.5,
		},
		{
			url: "/xlookpro-apps",
			lastmod: currentDate,
			changefreq: "monthly",
			priority: 0.5,
		},
		{
			url: "/schedule/haircut",
			lastmod: currentDate,
			changefreq: "monthly",
			priority: 0.5,
		},
		{
			url: "/schedule/beard-shaving",
			lastmod: currentDate,
			changefreq: "monthly",
			priority: 0.5,
		},
		{
			url: "/schedule/bundle",
			lastmod: currentDate,
			changefreq: "monthly",
			priority: 0.5,
		},
		{
			url: "/schedule/skin-care",
			lastmod: currentDate,
			changefreq: "monthly",
			priority: 0.5,
		},
		{
			url: "/schedule/groom",
			lastmod: currentDate,
			changefreq: "monthly",
			priority: 0.5,
		},
		{
			url: "/schedule/offers",
			lastmod: currentDate,
			changefreq: "monthly",
			priority: 0.5,
		},
		{
			url: "/schedule/50-EGP-Offer",
			lastmod: currentDate,
			changefreq: "monthly",
			priority: 0.5,
		},
		// Add the rest of your static links here
	];

	links.push(...staticLinks);

	// Generate employee URLs
	for (let employee of employees) {
		links.push({
			url: `/employee/${employee.employeeName.replace(/ /g, "-")}/${
				employee._id
			}${employee._id}${employee._id}`,
			changefreq: "weekly",
			priority: 0.8,
		});
	}

	// Generate store URLs
	for (let store of stores) {
		links.push({
			url: `/schedule/${store.addStoreName.replace(/ /g, "-")}/${
				store.storePhone
			}`,
			changefreq: "weekly",
			priority: 0.8,
		});
	}

	// Create a stream to pass to SitemapStream
	const sitemapStream = new SitemapStream({
		hostname: "https://xlookpro.com", // fixed the hostname here
	});

	// Add URLs to the sitemap
	for (let link of links) {
		sitemapStream.write(link);
	}

	sitemapStream.end();

	// Convert the stream to a promise
	const sitemapPromise = streamToPromise(sitemapStream);

	// Wait for the stream to be flushed and collect the XML content
	sitemapPromise
		.then((sitemap) => {
			const xmlContent = sitemap.toString();
			const writeStream = createWriteStream(
				resolve(__dirname, "../../hairbrush_frontend/public/sitemap.xml"),
				{ flags: "w" } // Set the 'w' flag to overwrite the existing file
			);
			writeStream.write(xmlContent, "utf-8");
			writeStream.end();
			writeStream.on("error", (err) => {
				console.error(err);
				res.status(500).end();
			});
			writeStream.on("finish", () => {
				console.log("Sitemap has been generated");
				res.send("Sitemap has been generated");
			});
		})
		.catch((err) => {
			console.error(err);
			res.status(500).end();
		});
});

module.exports = router;
