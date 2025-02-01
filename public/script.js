// Configuration for image paths and extensions
const config = {
    // Google Drive folder IDs
    folderIds: {
        couple: "17NOlOyvm6O8NEGLjbhTiwSKGYl1s8afa",    // This is the correct folder ID
        marriage: "1kUuwej0Onj7a7l0upeavOyCa2iJVUIDU",  // यहाँ marriage फोल्डर की ID
        family: "1vnU3Fqs-kw7H5F5VfIEX5obWqzs6wKdR",    // यहाँ family फोल्डर की ID
        sanjeeb: "14CiJalPwW1s5qo954PEuZBV50mK1MIQs",   // यहाँ sanjeeb फोल्डर की ID
        rina: "10aduJ2vOSPzYQKbuwEWPUShB8EZcvac_",      // यहाँ rina फोल्डर की ID
        ladly: "1rgb4t_C19RpqC_FYlyCN-PiO7CGWVf_r",     // यहाँ ladly फोल्डर की ID
        rishu: "1b02Dc_TILvfoP47GPvdEiWyc5aVewv_G"      // यहाँ rishu फोल्डर की ID
    },
    folders: ["couple", "marriage", "family", "sanjeeb", "rina", "ladly", "rishu"],
    // Define number of images in each folder
    imageCounts: {
        couple: 140,    // यहाँ actual संख्या डालें
        marriage: 130,  // यहाँ actual संख्या डालें
        family: 188,    // यहाँ actual संख्या डालें
        sanjeeb: 403,   // यहाँ actual संख्या डालें
        rina: 366,      // यहाँ actual संख्या डालें
        ladly: 445,     // यहाँ actual संख्या डालें
        rishu: 508      // यहाँ actual संख्या डालें
    }
}

// Global variables to track current state
let currentImages = [];
let currentImageIndex = 0;

// Add these variables at the top
const IMAGES_PER_PAGE = 1000; // Increased to handle all images
let currentPage = 0;
let isLoading = false;

// Change these settings
const CHUNK_SIZE = 50;  // Number of images to load at once
const TOTAL_CHUNKS = 20; // Maximum number of chunks to load

// Update API key
const API_KEY = 'AIzaSyBwWGV-owNZ66wYR9YcendvDxj4lqaN2LM';

// Update getImageIdsFromFolder function to handle no-cookie scenarios
async function getImageIdsFromFolder(folderId) {
    try {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name)&key=${API_KEY}`, {
            credentials: 'omit', // Don't send cookies
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        return data.files;
    } catch (error) {
        console.error('Error fetching images:', error);
        return [];
    }
}

// Update generateDriveImageUrl function
function generateDriveImageUrl(fileId) {
    // Use the no-cookie version of the URL
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
}

// Update generateImagesForFolder function
async function generateImagesForFolder(folder) {
    const folderId = config.folderIds[folder];
    const images = await getImageIdsFromFolder(folderId);
    
    return images.map((file, index) => ({
        src: generateDriveImageUrl(file.id),
        name: file.name || `${folder}-${index + 1}.jpg`,
        id: file.id
    }));
}

// Remove or comment out these unused functions
// function getGoogleDriveDirectLink(fileId) { ... }
// function verifyFolderAccess(folderId) { ... }

// Replace the existing fetchImagesFromFolder function with this
async function fetchImagesFromFolder(folder) {
    return await generateImagesForFolder(folder);
}

// Add error handling for image loading
function displayImages(images, append = false) {
    const gallery = document.getElementById("gallery");
    if (!append) {
        gallery.innerHTML = "";
        currentPage = 0;
    }
    
    currentImages = images; // Make sure this sets correctly
    let startIndex = currentPage * IMAGES_PER_PAGE;
    let currentChunk = 0;

    function loadNextChunk() {
        if (currentChunk >= TOTAL_CHUNKS) return;
        
        const endIndex = Math.min(startIndex + CHUNK_SIZE, images.length);
        const chunkedImages = images.slice(startIndex, endIndex);

        chunkedImages.forEach((image, index) => {
            const imgContainer = document.createElement("div");
            imgContainer.className = "gallery-item";

            const img = document.createElement("img");
            img.loading = "lazy";
            img.src = image.src;
            img.alt = image.name;

            // Add error handling for failed image loads
            img.onerror = function() {
                // Fallback to thumbnail URL if main URL fails
                this.src = `https://drive.google.com/thumbnail?id=${image.id}&sz=w1000`;
            };

            // Fix index calculation
            const actualIndex = index; // Remove startIndex addition
            img.onclick = function() {
                console.log('Total images:', currentImages.length);
                console.log('Clicking image at index:', actualIndex);
                openLightbox(actualIndex);
            };

            imgContainer.appendChild(img);
            gallery.appendChild(imgContainer);
        });

        startIndex = endIndex;
        currentChunk++;

        if (startIndex < images.length && currentChunk < TOTAL_CHUNKS) {
            setTimeout(loadNextChunk, 100); // Load next chunk after a small delay
        }
    }

    loadNextChunk();
}

// Add scroll event listener for mobile
let isLoadingMore = false;

window.addEventListener('scroll', () => {
    if (isLoadingMore) return;

    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
        isLoadingMore = true;
        displayImages(currentImages, true);
        setTimeout(() => { isLoadingMore = false; }, 500);
    }
});

// Update openLightbox function with logging
function openLightbox(index) {
    console.log('Opening lightbox with index:', index);
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) {
        console.error('Lightbox element not found!');
        return;
    }

    // Add array length check
    console.log('Current images length:', currentImages.length);
    
    // Ensure index is within bounds
    const validIndex = Math.min(Math.max(0, index), currentImages.length - 1);
    
    const lightboxImage = lightbox.querySelector('.lightbox-image');
    if (!lightboxImage) {
        console.error('Lightbox image element not found!');
        return;
    }

    currentImageIndex = validIndex;
    lightboxImage.src = currentImages[currentImageIndex].src;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function navigateImage(direction) {
    const newIndex = (currentImageIndex + direction + currentImages.length) % currentImages.length;
    
    // Validate new index
    if (newIndex >= 0 && newIndex < currentImages.length) {
        currentImageIndex = newIndex;
        const lightboxImage = document.querySelector('.lightbox-image');
        if (lightboxImage && currentImages[currentImageIndex]) {
            lightboxImage.src = currentImages[currentImageIndex].src;
        }
    }
}

function updateLightboxImage() {
    const lightboxImage = document.querySelector('.lightbox-image');
    if (lightboxImage && currentImages[currentImageIndex]) {
        lightboxImage.src = currentImages[currentImageIndex].src;
    }
}

// Lightbox functions
function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    
    // Clear the image source
    const lightboxImage = lightbox.querySelector('.lightbox-image');
    lightboxImage.src = '';
}

// Update these functions to fix double download issue
function updateDownloadButton() {
    // Remove this function entirely since we're handling download in downloadCurrentImage
}

function downloadCurrentImage() {
    const currentImage = currentImages[currentImageIndex];
    
    // Create temporary link
    const link = document.createElement("a");
    link.href = currentImage.src;
    link.download = currentImage.name;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Modify event listener for buttons
document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Generate initial image data
        const imageData = {};
        for (const folder of config.folders) {
            imageData[folder] = await generateImagesForFolder(folder);
        }

        // Use the generated images
        const allImages = Object.values(imageData).flat();
        displayImages(allImages);
        
        // Button click handlers
        const buttons = document.querySelectorAll(".nav-button");
        buttons.forEach((button) => {
            button.addEventListener("click", async () => {
                buttons.forEach((btn) => btn.classList.remove("active"));
                button.classList.add("active");
                currentPage = 0; // Reset page count on new filter

                const folder = button.dataset.folder;
                if (folder === "all") {
                    displayImages(allImages);
                } else {
                    const folderImages = await fetchImagesFromFolder(folder);
                    displayImages(folderImages);
                }
            });
        });

        // Lightbox event listeners
        const lightbox = document.getElementById('lightbox');
        const closeBtn = document.querySelector(".close-btn")
        const prevBtn = document.querySelector(".prev-btn")
        const nextBtn = document.querySelector(".next-btn")
        const downloadBtn = document.querySelector(".download-btn")

        closeBtn.addEventListener("click", closeLightbox)
        prevBtn.addEventListener("click", () => navigateImage(-1))
        nextBtn.addEventListener("click", () => navigateImage(1))
        downloadBtn.addEventListener("click", downloadCurrentImage) // Only one download handler

        // Close lightbox when clicking outside the image
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });

        // Prevent image click from closing lightbox
        lightbox.querySelector('.lightbox-image').addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Keyboard navigation
        document.addEventListener("keydown", (e) => {
            if (lightbox.style.display === "flex") {
                if (e.key === "Escape") closeLightbox()
                if (e.key === "ArrowLeft") navigateImage(-1)
                if (e.key === "ArrowRight") navigateImage(1)
            }
        })
    } catch (error) {
        console.error('Error loading gallery:', error);
    }
});

