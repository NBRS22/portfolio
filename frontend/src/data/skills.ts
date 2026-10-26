/**
 * Skills grouped by domain, from the CV and the Robot Interaction project. A skill can point to
 * the projects where it was used (project slugs), so the claim is backed by real work.
 */

export interface Skill {
  name: string
  projects?: string[]
}

export interface SkillGroup {
  domain: string
  description: string
  skills: Skill[]
}

export const skillGroups: SkillGroup[] = [
  {
    domain: "Robotics",
    description: "Mobile, manipulator and legged robots, from kinematics to navigation and control.",
    skills: [
      { name: "ROS 2 · Nav2 · MoveIt 2" },
      { name: "Mobile, manipulator & legged robots" },
      { name: "Kinematics & dynamics" },
      { name: "Modelling & control" },
    ],
  },
  {
    domain: "Physical AI",
    description: "Robot policies trained in simulation and digital twins, then transferred to real hardware.",
    skills: [
      { name: "Isaac Sim · Isaac Lab" },
      { name: "Digital twin · Unity" },
      { name: "Imitation & reinforcement learning" },
      { name: "Vision-Language-Action models (VLA)" },
      { name: "Sim-to-real transfer" },
    ],
  },
  {
    domain: "Artificial Intelligence",
    description: "Deep learning for vision and language, optimised to run on board.",
    skills: [
      { name: "PyTorch" },
      { name: "CNN · ViT · VLM · LLM" },
      { name: "OpenCV · Segment Anything (SAM) · YOLO" },
      { name: "Edge AI · CUDA · ONNX", projects: ["robot-interaction"] },
    ],
  },
  {
    domain: "Embedded Systems",
    description: "Boards, sensors, actuators and buses that connect the robot's hardware to its AI.",
    skills: [
      { name: "Microprocessors (NVIDIA Jetson, Raspberry Pi)" },
      { name: "Microcontrollers (STM32, ESP32)" },
      { name: "Sensors & instrumentation" },
      { name: "Actuators & motor control" },
      { name: "IoT · Industrial IoT · MQTT" },
      { name: "SPI · I²C · UART · CAN" },
    ],
  },
  {
    domain: "Mechatronics",
    description: "From industrial automation and PLCs to CAD, 3D printing and electronic prototyping.",
    skills: [
      { name: "Industrial automation · PLC" },
      { name: "CAD · Fusion 360" },
      { name: "3D printing" },
      { name: "Electronic prototyping" },
      { name: "Matlab / Simulink" },
      { name: "OPC-UA · PROFIBUS · PROFINET · Modbus TCP/RTU" },
    ],
  },
  {
    domain: "Programming & DevOps",
    description: "Languages and tools to build, ship and deploy, from the robot to the cloud.",
    skills: [
      { name: "Python" },
      { name: "C / C++" },
      { name: "SQL" },
      { name: "Linux · Bash" },
      { name: "Git · Docker" },
      { name: "Google Cloud Run" },
    ],
  },
]
