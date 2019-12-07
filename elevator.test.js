const { ElevatorCtl } = require("./elevator");

describe("elevator", () => {
  let elevator;
  beforeEach(() => {
    elevator = {
      init: () => {
        this.isGoingUp = true;
      },
      goingUpIndicator: val => {
        if (typeof val === "boolean") {
          this.isGoingUp = val;
        }
        return this.isGoingUp;
      },
      goingDownIndicator: val => {
        if (typeof val === "boolean") {
          this.isGoingUp = !val;
        }
        return !this.isGoingUp;
      },
      goToFloor: jest.fn(),
      currentFloor: jest.fn(),
    };
    elevator.init();
  });

  it("addFloorToStop", () => {
    const aElevator = new ElevatorCtl(elevator);
    aElevator.addFloorToStop(3);
    aElevator.addFloorToStop(1);
    aElevator.addFloorToStop(5);
    expect(aElevator.floorToStop).toEqual([1, 3, 5]);
  });

  it("removeFloorToStop", () => {
    const aElevator = new ElevatorCtl(elevator);
    aElevator.floorToStop = [1, 3, 5];

    aElevator.removeFloorToStop(3);
    expect(aElevator.floorToStop).toEqual([1, 5]);

    aElevator.removeFloorToStop(1);
    expect(aElevator.floorToStop).toEqual([5]);

    aElevator.removeFloorToStop(5);
    expect(aElevator.floorToStop).toEqual([]);
  });

  it("goToNextUpperFloor should call next higher floor", () => {
    const aElevator = new ElevatorCtl(elevator);
    aElevator.elevator.currentFloor = jest.fn().mockReturnValue(3);
    aElevator.floorToStop = [1, 3, 5];

    const result = aElevator.goToNextUpperFloor();

    expect(aElevator.elevator.goToFloor).toBeCalledWith(5, true);
    expect(result).toBe(5);
  });

  it("goToNextUpperFloor should return false if no higher floor", () => {
    const aElevator = new ElevatorCtl(elevator);
    aElevator.elevator.currentFloor = jest.fn().mockReturnValue(3);
    aElevator.floorToStop = [1, 3];

    const result = aElevator.goToNextUpperFloor();
    expect(aElevator.elevator.goToFloor).toBeCalledTimes(0);
    expect(result).toBe(false);
  });

  it("goToNextLowerFloor should return floor number", () => {
    const aElevator = new ElevatorCtl(elevator);
    aElevator.elevator.currentFloor = jest.fn().mockReturnValue(3);
    aElevator.floorToStop = [1, 3];

    aElevator.elevator.currentFloor = jest.fn().mockReturnValue(3);
    const result = aElevator.goToNextLowerFloor();
    expect(aElevator.elevator.goToFloor).toBeCalledWith(1, true);
    expect(result).toBe(1);
  });

  it("goToNextLowerFloor should return false if no lower floor", () => {
    const aElevator = new ElevatorCtl(elevator);
    aElevator.elevator.currentFloor = jest.fn().mockReturnValue(3);
    aElevator.floorToStop = [3, 5];

    elevator.currentFloor = jest.fn().mockReturnValue(3);
    const result = aElevator.goToNextLowerFloor();
    expect(aElevator.elevator.goToFloor).toBeCalledTimes(0);
    expect(result).toBe(false);
  });

  it("goToNextFloor", () => {
    const aElevator = new ElevatorCtl(elevator);
    aElevator.floorToStop = [1, 3, 5];

    aElevator.elevator.currentFloor = jest.fn().mockReturnValue(3);
    expect(aElevator.goToNextFloor()).toEqual(5);

    aElevator.elevator.currentFloor = jest.fn().mockReturnValue(5);
    expect(aElevator.goToNextFloor()).toEqual(3);

    aElevator.elevator.currentFloor = jest.fn().mockReturnValue(3);
    expect(aElevator.goToNextFloor()).toEqual(1);
  });
});
