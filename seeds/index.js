const mongoose = require('mongoose');
const Campground = require('../models/campground');
const cities = require('./citiesDataset');
const { places, descriptors } = require('./seedHelpers');
const axios = require('axios');

const mongoDB = 'mongodb://127.0.0.1/TrailBlaze';
mongoose.connect(mongoDB);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const namearray = (array) => array[Math.floor(Math.random() * array.length)];

const UNSPLASH_ACCESS_KEY = 'gPJIEkjYWEC4D6sgaRP5vkiYlkN3hDK7N8TQw4kNoRc';
const collectionId = 'XRWoial1tf4';

async function fetchCampgroundImages() {
    const response = await axios.get(`https://api.unsplash.com/collections/${collectionId}/photos`, {
        params: { client_id: UNSPLASH_ACCESS_KEY }
    });
    return response.data.map(photo => ({
        url: photo.urls.regular,
        filename: photo.slug // Use the photo slug as the filename
    }));
}

const seedDB = async () => {
    await Campground.deleteMany({});
    const images = await fetchCampgroundImages(); // Fetch images once
    for (let i = 0; i < 200; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const randomImg1 = Math.floor(Math.random() * images.length);
        const randomImg2 = Math.floor(Math.random() * (images.length-5));
        const price = Math.floor(Math.random() * 50) + 5;
        const camp = new Campground({
            author: '667903220037d72ab90b9df8',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${namearray(descriptors)} ${namearray(places)}`,
            geometry: {
                type: "Point",
                coordinates: [cities[random1000].longitude,cities[random1000].latitude]
            },
            images: [
                {
                    url: images[randomImg1].url,
                    filename: images[randomImg1].filename
                },
                {
                    url: images[randomImg2].url,
                    filename: images[randomImg2].filename
                }
            ],
            description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum nulla, eius velit ipsa expedita, excepturi rerum veniam, totam sit vel sapiente amet nihil aliquam ad culpa tenetur sint delectus omnis.',
            price,
        });
        await camp.save();
    }
};

seedDB().then(() => {
    mongoose.connection.close();
});
