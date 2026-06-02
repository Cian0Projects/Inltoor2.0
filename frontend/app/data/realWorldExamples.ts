// Real-world beam case studies for educational purposes
// All images are from Creative Commons or public domain sources

export interface CaseStudy {
  id: string;
  title: string;
  beamType: 'simply_supported' | 'cantilever';
  description: string;
  imagePath: string; // Local path in /public/examples/
  imageAttribution: string;
  realWorldContext: string;
  
  // Actual structure specifications
  specs: {
    span: number; // meters
    material: string;
    location: string;
    yearBuilt?: number;
    mainPurpose: string;
  };
  
  // Educational challenge: user identifies these
  actualLoads: {
    pointLoads: Array<{
      magnitude: number; // kN
      position: number; // m from left
      source: string; // e.g., "concentrated load from column"
    }>;
    distributedLoads: Array<{
      magnitude: number; // kN/m
      startPos: number;
      endPos: number;
      source: string; // e.g., "self weight + floor load"
    }>;
  };
  
  // Expected results for user to match
  expectedResults: {
    maxShear: number;
    maxMoment: number;
    maxDeflection?: number;
  };
  
  // Educational information
  failureHistory?: string;
  designConsiderations: string[];
  maintenanceNotes: string;
  interestingFact: string;
}

export const realWorldExamples: CaseStudy[] = [
  // SIMPLY SUPPORTED BEAMS
  {
    id: 'ss-pedestrian-bridge',
    title: 'Pedestrian Footbridge',
    beamType: 'simply_supported',
    description: 'A simple footbridge spanning a stream, commonly found in parks and hiking trails.',
    imagePath: '/examples/ss-pedestrian-bridge.jpg',
    imageAttribution: 'Your custom image',
    realWorldContext: 'These bridges are designed for foot traffic and light maintenance vehicles. The uniform distribution of people across the bridge creates a distributed load.',
    
    specs: {
      span: 12, // typical footbridge span in meters
      material: 'Timber with steel reinforcement',
      location: 'Typically over streams and gorges',
      mainPurpose: 'Pedestrian crossing',
    },
    
    actualLoads: {
      pointLoads: [
        {
          magnitude: 0.75, // kN per person
          position: 6,
          source: 'Concentrated group (5 people)',
        },
      ],
      distributedLoads: [
        {
          magnitude: 2.5, // kN/m - self weight + permanent fixtures
          startPos: 0,
          endPos: 12,
          source: 'Self-weight of bridge structure',
        },
        {
          magnitude: 5.0, // kN/m - distributed crowd
          startPos: 0,
          endPos: 12,
          source: 'Distributed pedestrian load (design load)',
        },
      ],
    },
    
    expectedResults: {
      maxShear: 52.5, // kN
      maxMoment: 225.0, // kNm at midspan
      maxDeflection: 0.045, // meters (45mm)
    },
    
    designConsiderations: [
      'Span must clear water without obstruction',
      'Slope for drainage and accessibility (max 1:12)',
      'Handrails required by building codes',
      'Impact from falling objects (trees, rocks)',
      'Seasonal load changes (snow in winter)',
    ],
    
    maintenanceNotes: 'Wooden footbridges require regular inspection for rot, especially at support points. Metal parts need rust checks.',
    
    interestingFact: 'The longest footbridges can span 300+ meters! The Millau Viaduct in France has a pedestrian path 343 meters above ground.',
  },
  
  {
    id: 'ss-highway-overpass',
    title: 'Highway Overpass Beam',
    beamType: 'simply_supported',
    description: 'A reinforced concrete beam forming part of a highway overpass bridge.',
    imagePath: '/examples/ss-highway-overpass.jpg',
    imageAttribution: 'Your custom image',
    realWorldContext: 'Highway overpasses must support the weight of vehicles travelling at high speeds. Engineers design for worst-case scenarios.',
    
    specs: {
      span: 15,
      material: 'Reinforced Concrete (RC)',
      location: 'Over highways and streets',
      yearBuilt: 2015,
      mainPurpose: 'Vehicle traffic crossing',
    },
    
    actualLoads: {
      pointLoads: [
        {
          magnitude: 150, // kN - semi-truck concentrated wheel load
          position: 5,
          source: 'Truck wheel load',
        },
        {
          magnitude: 150,
          position: 10,
          source: 'Truck rear axle',
        },
      ],
      distributedLoads: [
        {
          magnitude: 25.0, // kN/m - self weight
          startPos: 0,
          endPos: 15,
          source: 'Self-weight of concrete beam',
        },
        {
          magnitude: 15.0, // kN/m - asphalt surface + live load
          startPos: 0,
          endPos: 15,
          source: 'Asphalt surface and traffic',
        },
      ],
    },
    
    expectedResults: {
      maxShear: 600.0, // kN
      maxMoment: 2850.0, // kNm
      maxDeflection: 0.015, // meters (15mm) - very stiff
    },
    
    designConsiderations: [
      'Must support heavy trucks (up to 40 tonnes)',
      'Dynamic loads from traffic impact',
      'Temperature expansion and contraction',
      'Durability in harsh weather',
      'Corrosion protection for reinforcement',
      'Safety factor minimum 1.5x expected loads',
    ],
    
    maintenanceNotes: 'Concrete overpasses require inspection for cracking, spalling, and reinforcement corrosion. Salt from roads accelerates deterioration.',
    
    interestingFact: 'Interstate bridges are designed for a 75-year lifespan, but many are still functioning after 50+ years of heavy use. Regular maintenance extends their life significantly.',
  },
  
  {
    id: 'ss-floor-beam',
    title: 'Building Floor Beam',
    beamType: 'simply_supported',
    description: 'An interior floor beam in a multi-story office building supporting the floor slab.',
    imagePath: '/examples/ss-floor-beam.jpg',
    imageAttribution: 'Your custom image',
    realWorldContext: 'Floor beams in buildings must support permanent loads (floor, walls, ceiling) plus temporary occupancy loads (furniture, people).',
    
    specs: {
      span: 8,
      material: 'Structural Steel (W24x104)',
      location: 'Interior floor of office building',
      yearBuilt: 2010,
      mainPurpose: 'Support floor system',
    },
    
    actualLoads: {
      pointLoads: [],
      distributedLoads: [
        {
          magnitude: 3.5, // kN/m - self weight
          startPos: 0,
          endPos: 8,
          source: 'Self-weight of beam + floor slab',
        },
        {
          magnitude: 4.0, // kN/m - permanent fixtures
          startPos: 0,
          endPos: 8,
          source: 'Partitions, MEP, ceiling',
        },
        {
          magnitude: 2.5, // kN/m - occupancy load
          startPos: 0,
          endPos: 8,
          source: 'People and movable furniture',
        },
      ],
    },
    
    expectedResults: {
      maxShear: 48.0, // kN
      maxMoment: 96.0, // kNm
      maxDeflection: 0.008, // meters (8mm) - limited to L/1000
    },
    
    designConsiderations: [
      'Deflection limited to L/360 (live) or L/180 (total)',
      'Connection details at supports critical',
      'Lateral bracing prevents buckling',
      'Fireproofing added for safety',
      'Coordination with MEP systems',
    ],
    
    maintenanceNotes: 'Steel beams need periodic inspection for corrosion, especially in humid environments. Paint or coatings should be maintained.',
    
    interestingFact: 'A typical office floor is designed for 2.5-3.0 kN/m² live load (equivalent to about 250-300 people standing per square meter). Data centers use much higher values!',
  },
  
  // CANTILEVER BEAMS
  {
    id: 'cant-balcony',
    title: 'Building Balcony',
    beamType: 'cantilever',
    description: 'A cantilevered balcony extending from a residential or commercial building facade.',
    imagePath: '/examples/cant-balcony.jpg',
    imageAttribution: 'Your custom image',
    realWorldContext: 'Balconies are unsupported on the free end, so they experience maximum moment at the fixed end (building connection).',
    
    specs: {
      span: 3,
      material: 'Reinforced Concrete with steel railing',
      location: 'Building facade',
      yearBuilt: 2015,
      mainPurpose: 'Outdoor living space',
    },
    
    actualLoads: {
      pointLoads: [
        {
          magnitude: 5.0, // kN - person near edge
          position: 2.5,
          source: 'Person standing at edge',
        },
      ],
      distributedLoads: [
        {
          magnitude: 3.0, // kN/m - self weight
          startPos: 0,
          endPos: 3,
          source: 'Self-weight of concrete slab and railing',
        },
        {
          magnitude: 2.0, // kN/m - live load
          startPos: 0,
          endPos: 3,
          source: 'Occupancy load and furniture',
        },
      ],
    },
    
    expectedResults: {
      maxShear: 20.0, // kN (at fixed end)
      maxMoment: 37.5, // kNm (at fixed end - critical!)
      maxDeflection: 0.025, // meters (25mm)
    },
    
    designConsiderations: [
      'Fixed end must be fully anchored to building structure',
      'Waterproofing critical to prevent leaks into building',
      'Rail design must prevent child fall-through',
      'Snow load accumulation on edge critical in cold climates',
      'Thermal movement accommodation at connection',
      'Person at edge creates most critical loading condition',
    ],
    
    maintenanceNotes: 'Balcony connections are critical failure points. Regular inspection for cracks, rust staining (indicating rebar corrosion), and water damage is essential.',
    
    interestingFact: 'Many balcony collapses occur due to inadequate anchorment or corrosion of reinforcement. Building codes now require more stringent inspection schedules for cantilevers.',
  },
  
  {
    id: 'cant-parking-overhang',
    title: 'Parking Structure Overhang',
    beamType: 'cantilever',
    description: 'A cantilevered overhang at a parking structure edge, common in modern multi-story parking garages.',
    imagePath: '/examples/cant-parking-overhang.jpg',
    imageAttribution: 'Your custom image',
    realWorldContext: 'Parking overhangs extend beyond support columns to maximize usable space. The cantilever must handle heavy concentrated loads from parked vehicles.',
    
    specs: {
      span: 4.5,
      material: 'Reinforced Concrete',
      location: 'Parking garage structural system',
      yearBuilt: 2012,
      mainPurpose: 'Support parking surface beyond column line',
    },
    
    actualLoads: {
      pointLoads: [
        {
          magnitude: 15.0, // kN - car wheel load concentrated
          position: 3.5,
          source: 'Car wheel on edge of parking space',
        },
        {
          magnitude: 15.0,
          position: 4.2,
          source: 'Car wheel near free end',
        },
      ],
      distributedLoads: [
        {
          magnitude: 4.5, // kN/m - self weight
          startPos: 0,
          endPos: 4.5,
          source: 'Self-weight of concrete slab',
        },
        {
          magnitude: 5.0, // kN/m - vehicles + driving
          startPos: 0,
          endPos: 4.5,
          source: 'Parking load and friction from braking',
        },
      ],
    },
    
    expectedResults: {
      maxShear: 99.5, // kN
      maxMoment: 187.5, // kNm (at column support)
      maxDeflection: 0.032, // meters (32mm)
    },
    
    designConsiderations: [
      'Wheel load near free end is worst-case scenario',
      'Impact loads from vehicles entering/leaving',
      'Freeze-thaw cycles in cold climates damage concrete',
      'Salt corrosion from road treatment chemicals',
      'Torsional stress from vehicle braking',
      'Expansion joints every 30-40 meters',
    ],
    
    maintenanceNotes: 'Parking structures are exposed to harsh conditions. Regular seal-coating, repair of cracks, and drainage maintenance prevent deterioration.',
    
    interestingFact: 'Many parking structures were designed in the 1970s-1990s without adequate corrosion protection. Premature failure of early structures led to modern codes requiring increased durability measures.',
  },
  
  {
    id: 'cant-airport-canopy',
    title: 'Airport Terminal Canopy',
    beamType: 'cantilever',
    description: 'A large cantilevered canopy at an airport terminal providing weather protection for passenger drop-off zones.',
    imagePath: '/examples/cant-airport-canopy.jpg',
    imageAttribution: 'Your custom image',
    realWorldContext: 'Large cantilever structures require sophisticated engineering to span significant distances while minimizing deflection.',
    
    specs: {
      span: 6.0,
      material: 'Structural Steel with glass panels',
      location: 'Airport terminal front',
      yearBuilt: 2014,
      mainPurpose: 'Weather protection and architectural feature',
    },
    
    actualLoads: {
      pointLoads: [
        {
          magnitude: 25.0, // kN - snow accumulation at edge
          position: 5.5,
          source: 'Snow drift at free end',
        },
      ],
      distributedLoads: [
        {
          magnitude: 2.0, // kN/m - self weight
          startPos: 0,
          endPos: 6,
          source: 'Self-weight of steel + glass',
        },
        {
          magnitude: 3.5, // kN/m - wind and environmental
          startPos: 0,
          endPos: 6,
          source: 'Wind load upward and downward',
        },
        {
          magnitude: 1.5, // kN/m - maintenance personnel
          startPos: 0,
          endPos: 6,
          source: 'People for cleaning and maintenance',
        },
      ],
    },
    
    expectedResults: {
      maxShear: 73.0, // kN
      maxMoment: 237.0, // kNm (at fixed end)
      maxDeflection: 0.045, // meters (45mm) - quite visible!
    },
    
    designConsiderations: [
      'Wind load critical (can be uplift or downward)',
      'Snow drift accumulation at edges in cold climates',
      'Maintenance access and safety requirements',
      'Architectural aesthetics vs structural efficiency',
      'Glass panels add weight but provide weather protection',
      'Thermal movement due to sun exposure on glass',
      'Public safety - no failure allowed',
    ],
    
    maintenanceNotes: 'Large cantilevers require periodic deflection monitoring. Glass panels need cleaning and seal inspection. Steel should be inspected for fatigue cracks.',
    
    interestingFact: 'The Milau Viaduct in France has cantilever arms extending 205 meters from the towers! Modern engineering allows cantilevered structures to span truly impressive distances.',
  },
];

export const getCaseStudy = (id: string): CaseStudy | undefined => {
  return realWorldExamples.find(study => study.id === id);
};

export const getCaseStudiesByType = (beamType: 'simply_supported' | 'cantilever'): CaseStudy[] => {
  return realWorldExamples.filter(study => study.beamType === beamType);
};
