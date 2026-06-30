// Pony Firebase Config & Mock Database Wrapper
(function() {
  // HARDCODED PRODUCTION FIREBASE CONFIGURATION
  // Replace the placeholder values below with your real Google Firebase & Cloudinary web credentials
  const config = {
    apiKey: "AIzaSyDNMMQ9S7yRtjjyd1jy7CuZTp1UI-EQIVE",
    authDomain: "pony-flower-website.firebaseapp.com",
    projectId: "pony-flower-website",
    storageBucket: "pony-flower-website.appspot.com",
    messagingSenderId: "943857196270",
    appId: "1:943857196270:web:2397a48e191f0f2ea8e7ff",
    measurementId: "G-8WRDJSVN0Q",
    // Cloudinary configuration (Unsigned Uploads)
    cloudinary: {
      cloudName: "eut7ufma",
      uploadPreset: "pony-flowers"
    }
  };

  window.PONY_DB = {
    isCloud: false,
    db: null,
    auth: null,
    config: config, // expose config to other panels if needed
    
    // Initialized when Firebase scripts are loaded
    init: async function() {
      const isConfigured = config && config.apiKey && config.apiKey !== "YOUR_API_KEY";
      
      if (isConfigured && typeof firebase !== 'undefined') {
        try {
          // Initialize Firebase
          if (firebase.apps.length === 0) {
            firebase.initializeApp(config);
          }
          this.db = firebase.firestore();
          this.auth = firebase.auth();
          this.isCloud = true;
          console.log("🌸 Connected to Firebase Cloud Database!");
        } catch (err) {
          console.error("🌸 Firebase Auth/Firestore init failed, falling back to LocalStorage Sandbox:", err);
        }
      } else {
        console.log("🌸 Running in LocalStorage Sandbox (No Cloud Config)");
      }
    },
    
    // FETCH ALL FLOWERS
    getFlowers: async function() {
      if (this.isCloud) {
        try {
          const snapshot = await this.db.collection('flowers').get();
          if (!snapshot.empty) {
            const flowers = [];
            snapshot.forEach(doc => {
              flowers.push({ id: doc.id, ...doc.data() });
            });
            return flowers;
          }
        } catch (e) {
          console.error("Firestore getFlowers failed, falling back to local:", e);
        }
      }
      // LocalStorage mode
      const localFlowers = localStorage.getItem('pony_flowers');
      return localFlowers ? JSON.parse(localFlowers) : [];
    },
    
    // SAVE ALL FLOWERS (Used for initial seed or admin override)
    saveFlowers: async function(flowers) {
      if (this.isCloud) {
        try {
          const batch = this.db.batch();
          for (let f of flowers) {
            const docId = f.id || f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const ref = this.db.collection('flowers').doc(docId);
            batch.set(ref, f);
          }
          await batch.commit();
          return;
        } catch (e) {
          console.error("Firestore saveFlowers failed:", e);
        }
      }
      localStorage.setItem('pony_flowers', JSON.stringify(flowers));
    },
    
    // ADD FLOWER
    addFlower: async function(flower) {
      if (!flower.id) {
        flower.id = flower.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random()*1000);
      }
      if (this.isCloud) {
        try {
          await this.db.collection('flowers').doc(flower.id).set(flower);
          return flower;
        } catch (e) {
          console.error("Firestore addFlower failed:", e);
        }
      }
      const flowers = await this.getFlowers();
      flowers.push(flower);
      localStorage.setItem('pony_flowers', JSON.stringify(flowers));
      return flower;
    },
    
    // EDIT FLOWER
    updateFlower: async function(id, updatedData) {
      if (this.isCloud) {
        try {
          await this.db.collection('flowers').doc(id).update(updatedData);
          return;
        } catch (e) {
          console.error("Firestore updateFlower failed:", e);
        }
      }
      const flowers = await this.getFlowers();
      const index = flowers.findIndex(f => f.id === id);
      if (index !== -1) {
        flowers[index] = { ...flowers[index], ...updatedData };
        localStorage.setItem('pony_flowers', JSON.stringify(flowers));
      }
    },
    
    // DELETE FLOWER
    deleteFlower: async function(id) {
      if (this.isCloud) {
        try {
          await this.db.collection('flowers').doc(id).delete();
          return;
        } catch (e) {
          console.error("Firestore deleteFlower failed:", e);
        }
      }
      const flowers = await this.getFlowers();
      const filtered = flowers.filter(f => f.id !== id);
      localStorage.setItem('pony_flowers', JSON.stringify(filtered));
    },
    
    // SUBMIT ORDER
    addOrder: async function(order) {
      order.timestamp = new Date().toISOString();
      order.status = 'Pending';
      if (this.isCloud) {
        try {
          const docRef = await this.db.collection('orders').add(order);
          order.id = docRef.id;
          return order;
        } catch (e) {
          console.error("Firestore addOrder failed:", e);
        }
      }
      // LocalStorage mode
      const orders = await this.getOrders();
      order.id = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
      orders.push(order);
      localStorage.setItem('pony_orders', JSON.stringify(orders));
      return order;
    },
    
    // GET ORDERS
    getOrders: async function() {
      if (this.isCloud) {
        try {
          const snapshot = await this.db.collection('orders').get();
          const orders = [];
          snapshot.forEach(doc => {
            orders.push({ id: doc.id, ...doc.data() });
          });
          // Sort by timestamp desc
          return orders.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
        } catch (e) {
          console.error("Firestore getOrders failed:", e);
        }
      }
      const localOrders = localStorage.getItem('pony_orders');
      const parsed = localOrders ? JSON.parse(localOrders) : [];
      return parsed.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    },
    
    // UPDATE ORDER STATUS
    updateOrderStatus: async function(id, status) {
      if (this.isCloud) {
        try {
          await this.db.collection('orders').doc(id).update({ status: status });
          return;
        } catch (e) {
          console.error("Firestore updateOrderStatus failed:", e);
        }
      }
      const orders = await this.getOrders();
      const index = orders.findIndex(o => o.id === id);
      if (index !== -1) {
        orders[index].status = status;
        localStorage.setItem('pony_orders', JSON.stringify(orders));
      }
    },
    
    // DELETE ORDER
    deleteOrder: async function(id) {
      if (this.isCloud) {
        try {
          await this.db.collection('orders').doc(id).delete();
          return;
        } catch (e) {
          console.error("Firestore deleteOrder failed:", e);
        }
      }
      const orders = await this.getOrders();
      const filtered = orders.filter(o => o.id !== id);
      localStorage.setItem('pony_orders', JSON.stringify(filtered));
    }
  };
})();
