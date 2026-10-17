
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import crypto from "crypto";

import {
  userSchema,
  foodDonationSchema,
  foodSafetyAssessmentSchema,
  rescueRequestSchema,
  ngoAssignmentSchema,
  volunteerAssignmentSchema,
  verificationRecordSchema,
  complaintSchema,
  emergencyRequestSchema,
  auditLogSchema,
  notificationSchema
} from "./models/index";

// ==========================================
// LOCAL PERSISTENCE FALLBACK
// ==========================================

const DATA_DIR = path.join(process.cwd(), "server", "data");
const DB_FILE = path.join(DATA_DIR, "safeserve_db.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let isUsingRealMongo = false;

// ==========================================
// ACTUAL MONGOOSE MODELS
// ==========================================

export const MongoUser = mongoose.model("User", userSchema);

export const MongoFoodDonation = mongoose.model(
  "FoodDonation",
  foodDonationSchema
);

export const MongoFoodSafetyAssessment = mongoose.model(
  "FoodSafetyAssessment",
  foodSafetyAssessmentSchema
);

export const MongoRescueRequest = mongoose.model(
  "RescueRequest",
  rescueRequestSchema
);

export const MongoNGOAssignment = mongoose.model(
  "NGOAssignment",
  ngoAssignmentSchema
);

export const MongoVolunteerAssignment = mongoose.model(
  "VolunteerAssignment",
  volunteerAssignmentSchema
);

export const MongoVerificationRecord = mongoose.model(
  "VerificationRecord",
  verificationRecordSchema
);

export const MongoComplaint = mongoose.model(
  "Complaint",
  complaintSchema
);

export const MongoEmergencyRequest = mongoose.model(
  "EmergencyRequest",
  emergencyRequestSchema
);

export const MongoAuditLog = mongoose.model(
  "AuditLog",
  auditLogSchema
);

export const MongoNotification = mongoose.model(
  "Notification",
  notificationSchema
);

// ==========================================
// LOCAL COLLECTION
// Used only if MongoDB Atlas is unavailable
// ==========================================

class LocalCollection {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  private loadAll(): any[] {
    try {
      if (!fs.existsSync(DB_FILE)) {
        return [];
      }

      const data = JSON.parse(
        fs.readFileSync(DB_FILE, "utf-8")
      );

      return data[this.name] || [];
    } catch {
      return [];
    }
  }

  private saveAll(items: any[]) {
    try {
      let data: any = {};

      if (fs.existsSync(DB_FILE)) {
        try {
          data = JSON.parse(
            fs.readFileSync(DB_FILE, "utf-8")
          );
        } catch {
          data = {};
        }
      }

      data[this.name] = items;

      fs.writeFileSync(
        DB_FILE,
        JSON.stringify(data, null, 2)
      );
    } catch (err) {
      console.error(
        `Failed to persist collection ${this.name}:`,
        err
      );
    }
  }

  async find(query: any = {}): Promise<any[]> {
    const items = this.loadAll();

    return items
      .filter(item => matchQuery(item, query))
      .map(deepClone);
  }

  async findOne(query: any = {}): Promise<any | null> {
    const items = this.loadAll();

    const found = items.find(item =>
      matchQuery(item, query)
    );

    return found ? deepClone(found) : null;
  }

  async findById(id: string): Promise<any | null> {
    if (!id) {
      return null;
    }

    const items = this.loadAll();

    const found = items.find(
      item => String(item._id) === String(id)
    );

    return found ? deepClone(found) : null;
  }

  async create(doc: any): Promise<any> {
    const items = this.loadAll();

    const newDoc = {
      ...doc,
      _id:
        doc._id ||
        new mongoose.Types.ObjectId().toString(),
      createdAt:
        doc.createdAt ||
        new Date().toISOString(),
      updatedAt:
        doc.updatedAt ||
        new Date().toISOString()
    };

    items.push(newDoc);

    this.saveAll(items);

    return deepClone(newDoc);
  }

  async insertMany(
    docs: any[]
  ): Promise<any[]> {
    const created: any[] = [];

    for (const d of docs) {
      created.push(await this.create(d));
    }

    return created;
  }

  async findByIdAndUpdate(
    id: string,
    update: any,
    options: any = {
      returnDocument: "after"
    }
  ): Promise<any | null> {
    const items = this.loadAll();

    const index = items.findIndex(
      item => String(item._id) === String(id)
    );

    if (index === -1) {
      return null;
    }

    let target = items[index];

    const updateFields = update.$set
      ? {
          ...update,
          ...update.$set
        }
      : {
          ...update
        };

    delete updateFields.$set;
    delete updateFields.$inc;

    if (update.$inc) {
      for (const [key, val] of Object.entries(
        update.$inc
      )) {
        target[key] =
          (Number(target[key]) || 0) +
          Number(val);
      }
    }

    const updated = {
      ...target,
      ...updateFields,
      updatedAt: new Date().toISOString()
    };

    items[index] = updated;

    this.saveAll(items);

    return deepClone(updated);
  }

  async findByIdAndDelete(
    id: string
  ): Promise<any | null> {
    const items = this.loadAll();

    const index = items.findIndex(
      item => String(item._id) === String(id)
    );

    if (index === -1) {
      return null;
    }

    const [deleted] = items.splice(index, 1);

    this.saveAll(items);

    return deepClone(deleted);
  }

  async countDocuments(
    query: any = {}
  ): Promise<number> {
    const items = this.loadAll();

    return items.filter(item =>
      matchQuery(item, query)
    ).length;
  }
}

// ==========================================
// QUERY MATCHING FOR LOCAL DATABASE
// ==========================================

function matchQuery(
  item: any,
  query: any
): boolean {
  if (
    !query ||
    Object.keys(query).length === 0
  ) {
    return true;
  }

  for (const [key, val] of Object.entries(query)) {
    if (
      key === "$or" &&
      Array.isArray(val)
    ) {
      const orMatched = val.some(
        subQ => matchQuery(item, subQ)
      );

      if (!orMatched) {
        return false;
      }

      continue;
    }

    if (
      val &&
      typeof val === "object" &&
      !Array.isArray(val)
    ) {
      if (
        "$in" in val &&
        Array.isArray(
          (val as any).$in
        )
      ) {
        const itemVal = item[key];

        const inMatch = (
          val as any
        ).$in.some(
          (v: any) =>
            String(v) ===
            String(itemVal)
        );

        if (!inMatch) {
          return false;
        }

        continue;
      }

      if ("$ne" in val) {
        if (
          String(item[key]) ===
          String((val as any).$ne)
        ) {
          return false;
        }

        continue;
      }

      if ("$regex" in val) {
        const regObj = val as any;

        const reg = new RegExp(
          String(regObj.$regex),
          regObj.$options || "i"
        );

        if (
          !reg.test(
            String(item[key] || "")
          )
        ) {
          return false;
        }

        continue;
      }
    }

    if (
      String(item[key]) !==
      String(val)
    ) {
      return false;
    }
  }

  return true;
}

// ==========================================
// DEEP CLONE
// ==========================================

function deepClone(obj: any) {
  return JSON.parse(
    JSON.stringify(obj)
  );
}

// ==========================================
// ADAPTIVE REPOSITORY
// MongoDB Atlas OR Local Database
// ==========================================

class Repository {
  private mongoModel: any;
  private localModel: LocalCollection;

  constructor(
    mongoModel: any,
    collectionName: string
  ) {
    this.mongoModel = mongoModel;

    this.localModel =
      new LocalCollection(
        collectionName
      );
  }

  // ========================================
  // FIND
  // ========================================

  async find(
    query: any = {}
  ): Promise<any[]> {
    if (isUsingRealMongo) {
      return await this.mongoModel
        .find(query)
        .sort({
          createdAt: -1
        })
        .lean();
    }

    console.warn(
      "WARNING: Using LOCAL database for FIND:",
      this.localModel.name
    );

    const results =
      await this.localModel.find(
        query
      );

    return results.sort(
      (a: any, b: any) =>
        new Date(
          b.createdAt || 0
        ).getTime() -
        new Date(
          a.createdAt || 0
        ).getTime()
    );
  }

  // ========================================
  // FIND ONE
  // ========================================

  async findOne(
    query: any = {}
  ): Promise<any | null> {
    if (isUsingRealMongo) {
      return await this.mongoModel
        .findOne(query)
        .lean();
    }

    console.warn(
      "WARNING: Using LOCAL database for FIND ONE:",
      this.localModel.name
    );

    return await this.localModel.findOne(
      query
    );
  }

  // ========================================
  // FIND BY ID
  // ========================================

  async findById(
    id: string
  ): Promise<any | null> {
    if (isUsingRealMongo) {
      return await this.mongoModel
        .findById(id)
        .lean();
    }

    console.warn(
      "WARNING: Using LOCAL database for FIND BY ID:",
      id
    );

    return await this.localModel.findById(
      id
    );
  }

  // ========================================
  // CREATE
  // ========================================

  async create(
    doc: any
  ): Promise<any> {
    if (isUsingRealMongo) {
      const created =
        await this.mongoModel.create(
          doc
        );

      return created.toObject();
    }

    console.warn(
      "WARNING: Creating document in LOCAL database:",
      this.localModel.name
    );

    return await this.localModel.create(
      doc
    );
  }

  // ========================================
  // FIND BY ID AND UPDATE
  // ========================================

  async findByIdAndUpdate(
    id: string,
    update: any,
    options: any = {
      returnDocument: "after"
    }
  ): Promise<any | null> {

    // --------------------------------------
    // MONGODB ATLAS
    // --------------------------------------

    if (isUsingRealMongo) {

      console.log(
        "=========================================="
      );

      console.log(
        "MONGODB USER/DOCUMENT UPDATE STARTED"
      );

      console.log(
        "MongoDB Database:",
        mongoose.connection.name
      );

      console.log(
        "MongoDB Host:",
        mongoose.connection.host
      );

      console.log(
        "Collection:",
        this.mongoModel.collection.name
      );

      console.log(
        "Document ID:",
        id
      );

      console.log(
        "Update:",
        update
      );

      try {

        // First check the document
        const before =
          await this.mongoModel
            .findById(id)
            .lean();

        console.log(
          "DOCUMENT BEFORE UPDATE:",
          before
        );

        if (!before) {

          console.error(
            "DOCUMENT NOT FOUND IN MONGODB!"
          );

          console.log(
            "MONGODB UPDATE FAILED"
          );

          console.log(
            "=========================================="
          );

          return null;
        }

        // Perform update
        const updated =
          await this.mongoModel
            .findByIdAndUpdate(
              id,
              update,
              {
                ...options,
                returnDocument:
                  "after"
              }
            )
            .lean();

        console.log(
          "MONGODB UPDATE RESULT:",
          updated
        );

        if (!updated) {

          console.error(
            "MONGODB UPDATE RETURNED NULL"
          );

          console.log(
            "=========================================="
          );

          return null;
        }

        // ------------------------------------
        // VERIFY DIRECTLY FROM MONGODB
        // ------------------------------------

        const verified =
          await this.mongoModel
            .findById(id)
            .lean();

        console.log(
          "DOCUMENT AFTER UPDATE:",
          verified
        );

        console.log(
          "UPDATED STATUS:",
          verified?.status
        );

        console.log(
          "UPDATED EMAIL:",
          verified?.email
        );

        console.log(
          "MONGODB UPDATE SUCCESSFUL"
        );

        console.log(
          "=========================================="
        );

        return verified;

      } catch (error: any) {

        console.error(
          "MONGODB UPDATE ERROR:",
          error
        );

        console.error(
          "MONGODB UPDATE ERROR MESSAGE:",
          error?.message
        );

        console.log(
          "=========================================="
        );

        throw error;
      }
    }

    // --------------------------------------
    // LOCAL DATABASE FALLBACK
    // --------------------------------------

    console.warn(
      "=========================================="
    );

    console.warn(
      "WARNING: MONGODB IS NOT BEING USED!"
    );

    console.warn(
      "UPDATING LOCAL JSON DATABASE INSTEAD"
    );

    console.warn(
      "Local DB File:",
      DB_FILE
    );

    console.warn(
      "Document ID:",
      id
    );

    console.warn(
      "Update:",
      update
    );

    console.warn(
      "=========================================="
    );

    return await this.localModel.findByIdAndUpdate(
      id,
      update,
      options
    );
  }

  // ========================================
  // FIND BY ID AND DELETE
  // ========================================

  async findByIdAndDelete(
    id: string
  ): Promise<any | null> {

    if (isUsingRealMongo) {
      return await this.mongoModel
        .findByIdAndDelete(id)
        .lean();
    }

    console.warn(
      "WARNING: Deleting from LOCAL database:",
      id
    );

    return await this.localModel.findByIdAndDelete(
      id
    );
  }

  // ========================================
  // COUNT DOCUMENTS
  // ========================================

  async countDocuments(
    query: any = {}
  ): Promise<number> {

    if (isUsingRealMongo) {
      return await this.mongoModel.countDocuments(
        query
      );
    }

    return await this.localModel.countDocuments(
      query
    );
  }
}

// ==========================================
// EXPORTED REPOSITORIES
// ==========================================

export const User =
  new Repository(
    MongoUser,
    "users"
  );

export const FoodDonation =
  new Repository(
    MongoFoodDonation,
    "foodDonations"
  );

export const FoodSafetyAssessment =
  new Repository(
    MongoFoodSafetyAssessment,
    "foodSafetyAssessments"
  );

export const RescueRequest =
  new Repository(
    MongoRescueRequest,
    "rescueRequests"
  );

export const NGOAssignment =
  new Repository(
    MongoNGOAssignment,
    "ngoAssignments"
  );

export const VolunteerAssignment =
  new Repository(
    MongoVolunteerAssignment,
    "volunteerAssignments"
  );

export const VerificationRecord =
  new Repository(
    MongoVerificationRecord,
    "verificationRecords"
  );

export const Complaint =
  new Repository(
    MongoComplaint,
    "complaints"
  );

export const EmergencyRequest =
  new Repository(
    MongoEmergencyRequest,
    "emergencyRequests"
  );

export const AuditLog =
  new Repository(
    MongoAuditLog,
    "auditLogs"
  );

export const Notification =
  new Repository(
    MongoNotification,
    "notifications"
  );

// ==========================================
// DATABASE CONNECTION
// ==========================================

export async function connectDB() {

  const mongoUri =
    process.env.MONGODB_URI;

  if (
    mongoUri &&
    mongoUri.trim() !== ""
  ) {

    try {

      console.log(
        "=========================================="
      );

      console.log(
        "Connecting to MongoDB Atlas..."
      );

      await mongoose.connect(
        mongoUri,
        {
          serverSelectionTimeoutMS: 5000
        }
      );

      isUsingRealMongo = true;

      console.log(
        "=========================================="
      );

      console.log(
        "MONGODB ATLAS CONNECTION SUCCESSFUL"
      );

      console.log(
        "Database Name:",
        mongoose.connection.name
      );

      console.log(
        "MongoDB Host:",
        mongoose.connection.host
      );

      console.log(
        "MongoDB Ready State:",
        mongoose.connection.readyState
      );

      console.log(
        "User Collection:",
        MongoUser.collection.name
      );

      console.log(
        "Food Donation Collection:",
        MongoFoodDonation.collection.name
      );

      console.log(
        "=========================================="
      );

    } catch (err: any) {

      console.warn(
        "=========================================="
      );

      console.warn(
        "MONGODB ATLAS CONNECTION FAILED"
      );

      console.warn(
        "Reason:",
        err.message
      );

      console.warn(
        "FALLING BACK TO LOCAL DATABASE"
      );

      console.warn(
        "Local DB File:",
        DB_FILE
      );

      console.warn(
        "=========================================="
      );

      isUsingRealMongo = false;

    }

  } else {

    console.warn(
      "=========================================="
    );

    console.warn(
      "NO MONGODB_URI FOUND"
    );

    console.warn(
      "USING LOCAL DATABASE"
    );

    console.warn(
      "Local DB File:",
      DB_FILE
    );

    console.warn(
      "=========================================="
    );

    isUsingRealMongo = false;
  }

  await seedDatabase();
}

// ==========================================
// DATABASE SEEDING
// ==========================================

async function seedDatabase() {

  try {

    const adminCount =
      await User.countDocuments({
        role: "ADMIN"
      });

    if (adminCount === 0) {

      console.log(
        "Seeding default SafeServe Admin and initial operational roles..."
      );

      const adminPassword =
        await bcrypt.hash(
          "AdminSafeServe2026!",
          10
        );

      const donorPassword =
        await bcrypt.hash(
          "Donor123!",
          10
        );

      const ngoPassword =
        await bcrypt.hash(
          "Ngo123!",
          10
        );

      const volunteerPassword =
        await bcrypt.hash(
          "Volunteer123!",
          10
        );

      // ======================================
      // 1. SUPER ADMIN
      // ======================================

      const adminUser =
        await User.create({

          fullName:
            "SafeServe Lead Administrator",

          email:
            "admin@safeserve.org",

          phone:
            "+91 98765 43210",

          password:
            adminPassword,

          role:
            "ADMIN",

          status:
            "VERIFIED",

          trustScore:
            100,

          address:
            "SafeServe National Logistics HQ, 14 Connaught Place",

          city:
            "New Delhi",

          state:
            "Delhi",

          pincode:
            "110001",

          latitude:
            28.6328,

          longitude:
            77.2197
        });

      // ======================================
      // 2. VERIFIED DONOR
      // ======================================

      const donorUser =
        await User.create({

          fullName:
            "Chef Rajesh Verma",

          organizationName:
            "Royal Feast Banquets & Catering",

          email:
            "donor@royalfeast.com",

          phone:
            "+91 98111 22334",

          password:
            donorPassword,

          role:
            "DONOR",

          status:
            "VERIFIED",

          trustScore:
            94,

          address:
            "Sector 18 Commercial Complex, Block B",

          city:
            "Noida",

          state:
            "Uttar Pradesh",

          pincode:
            "201301",

          latitude:
            28.5708,

          longitude:
            77.3261,

          totalDonationsCount:
            14,

          totalFoodRescuedKg:
            420
        });

      // ======================================
      // 3. VERIFIED NGO
      // ======================================

      const ngoUser =
        await User.create({

          fullName:
            "Ananya Sharma",

          organizationName:
            "Care & Nourish Foundation",

          contactPerson:
            "Ananya Sharma (Director of Ops)",

          email:
            "ngo@carenourish.org",

          phone:
            "+91 98222 33445",

          password:
            ngoPassword,

          role:
            "NGO",

          status:
            "VERIFIED",

          trustScore:
            96,

          foodCapacity:
            450,

          serviceArea:
            "Delhi NCR East & Central Zone",

          requiredFoodCategories: [
            "Cooked Meals",
            "Baked Goods",
            "Packaged Food",
            "Fresh Produce"
          ],

          address:
            "Plot 42, Community Welfare Centre, Mayur Vihar Phase 1",

          city:
            "New Delhi",

          state:
            "Delhi",

          pincode:
            "110091",

          latitude:
            28.6083,

          longitude:
            77.2965,

          completedDeliveries:
            38
        });

      // ======================================
      // 4. VERIFIED VOLUNTEER
      // ======================================

      const volunteerUser =
        await User.create({

          fullName:
            "Vikram Malhotra",

          email:
            "volunteer@cityrescue.org",

          phone:
            "+91 98333 44556",

          password:
            volunteerPassword,

          role:
            "VOLUNTEER",

          status:
            "VERIFIED",

          trustScore:
            92,

          transportation:
            "Two-Wheeler (Insulated Delivery Carrier)",

          availability:
            "Immediate / Weekday Evenings",

          address:
            "A-12 Defence Colony",

          city:
            "New Delhi",

          state:
            "Delhi",

          pincode:
            "110024",

          latitude:
            28.5733,

          longitude:
            77.2341,

          completedPickups:
            22,

          completedDeliveries:
            22
        });

      // ======================================
      // 5. SEED ACTIVE DONATION
      // ======================================

      const donation =
        await FoodDonation.create({

          donorId:
            donorUser._id,

          donorName:
            donorUser.fullName,

          donorOrg:
            donorUser.organizationName,

          donorPhone:
            donorUser.phone,

          foodName:
            "Steamed Basmati Rice & Paneer Butter Masala",

          foodCategory:
            "Cooked Meals",

          quantity:
            80,

          unit:
            "meals",

          preparationDate:
            new Date()
              .toISOString()
              .split("T")[0],

          preparationTime:
            "18:30",

          expiryDate:
            new Date(
              Date.now() +
              24 * 3600 * 1000
            )
              .toISOString()
              .split("T")[0],

          expiryTime:
            "23:00",

          storageCondition:
            "Hot Held (> 60°C)",

          packagingCondition:
            "Food Grade Airtight Containers",

          pickupAddress:
            "Sector 18 Banquet Hall Entrance, Gate 2",

          city:
            "Noida",

          state:
            "Uttar Pradesh",

          latitude:
            28.5708,

          longitude:
            77.3261,

          description:
            "Freshly prepared vegetarian meals from corporate symposium catering. Packed in hygienic thermal food grade containers.",

          imageUrl:
            "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80",

          cloudinaryPublicId:
            "sample_basmati_rice",

          safetyScore:
            92,

          safetyStatus:
            "ELIGIBLE",

          safetyReason:
            "Preparation is fresh, hot-held within safe temperature zones, airtight food grade packaging.",

          status:
            "APPROVED"
        });

      // ======================================
      // FOOD SAFETY ASSESSMENT
      // ======================================

      await FoodSafetyAssessment.create({

        donationId:
          donation._id,

        score:
          92,

        status:
          "ELIGIBLE",

        reason:
          "Preparation is fresh, hot-held within safe temperature zones, airtight food grade packaging.",

        hoursRemaining:
          18,

        storageSuitability:
          "Optimal",

        packagingIntegrity:
          "Airtight & Sealed",

        evaluatedAt:
          new Date()
      });

      // ======================================
      // INITIAL AUDIT LOG
      // ======================================

      await AuditLog.create({

        userId:
          adminUser._id,

        userEmail:
          adminUser.email,

        role:
          "ADMIN",

        action:
          "SYSTEM_INITIALIZATION",

        entityType:
          "SYSTEM",

        entityId:
          "SYSTEM_ROOT",

        status:
          "SUCCESS",

        description:
          "SafeServe core engine initialized with verified operational test actors.",

        ipAddress:
          "127.0.0.1"
      });

      // ======================================
      // WELCOME NOTIFICATION
      // ======================================

      await Notification.create({

        userId:
          donorUser._id,

        title:
          "Welcome to SafeServe",

        message:
          "Your donor account is verified. You can now publish surplus food donations anytime.",

        type:
          "SUCCESS",

        isRead:
          false
      });

      console.log(
        "SafeServe initial roles & seed data established successfully."
      );
    }

  } catch (err) {

    console.error(
      "Error during database seed:",
      err
    );
  }
}