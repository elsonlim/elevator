const elevator = {
  init: function(elevators, floors) {
    const MAX_LEVEL = floors.length - 1;

    class ElevatorCtl {
      constructor(elevator) {
        this.elevator = elevator;
        this.floorToStop = [];
        this.elevator.goingUpIndicator(true);
        this.elevator.goingDownIndicator(false);
      }

      addFloorToStop(num) {
        if (!this.floorToStop.includes(num)) {
          this.floorToStop.push(num);
          this.floorToStop.sort((a, b) => a - b);
        }
      }

      removeFloorToStop(num) {
        if (this.floorToStop.includes(num)) {
          const filteredFloors = this.floorToStop.filter(cur => num !== cur);
          this.floorToStop = filteredFloors;
        }
      }

      goToNextUpperFloor() {
        this.elevator.goingUpIndicator(true);
        this.elevator.goingDownIndicator(false);

        const curFloor = this.elevator.currentFloor();
        const targetFloors = this.floorToStop.filter(num => {
          return num > curFloor;
        });

        if (targetFloors.length) {
          const nextFloor = targetFloors.shift();
          this.elevator.goToFloor(nextFloor, true);
          return nextFloor;
        }
        return false;
      }

      goToNextLowerFloor() {
        this.elevator.goingUpIndicator(false);
        this.elevator.goingDownIndicator(true);

        const curFloor = this.elevator.currentFloor();
        const targetFloors = this.floorToStop.filter(num => num < curFloor);

        if (targetFloors.length) {
          const nextFloor = targetFloors.pop();
          this.elevator.goToFloor(nextFloor, true);
          return nextFloor;
        }
        return false;
      }

      hasHigherFloorToStop() {
        const curFloor = this.elevator.currentFloor();
        return !!this.floorToStop.filter(num => {
          return num > curFloor;
        }).length;
      }

      hasLowerFloorToStop() {
        const curFloor = this.elevator.currentFloor();
        return !!this.floorToStop.filter(num => {
          return num < curFloor;
        }).length;
      }

      getCurFloor() {
        return this.elevator.currentFloor();
      }

      isGoingUp() {
        return !!this.elevator.goingUpIndicator();
      }

      setIsGoingUp(isGoingUp) {
        this.elevator.goingUpIndicator(isGoingUp);
        this.elevator.goingDownIndicator(!isGoingUp);
      }

      goToNextFloor() {
        console.log(
          "next",
          this.elevator.currentFloor(),
          this.elevator.goingUpIndicator(),
          this.elevator.goingDownIndicator(),
        );

        if (this.elevator.currentFloor() === 0) {
          this.elevator.goingUpIndicator(true);
          this.elevator.goingDownIndicator(false);
          return this.goToNextUpperFloor();
        } else if (this.elevator.currentFloor() === MAX_LEVEL) {
          this.elevator.goingUpIndicator(false);
          this.elevator.goingDownIndicator(true);
          return this.goToNextLowerFloor();
        }

        const isGoingUp = this.elevator.goingUpIndicator();

        if (isGoingUp && this.hasHigherFloorToStop()) {
          return this.goToNextUpperFloor();
        } else if (!isGoingUp && this.hasLowerFloorToStop()) {
          return this.goToNextLowerFloor();
        } else if (isGoingUp && this.hasLowerFloorToStop()) {
          return this.goToNextLowerFloor();
        } else if (!isGoingUp && this.hasHigherFloorToStop()) {
          return this.goToNextUpperFloor();
        }
      }
    }

    var elevatorControllers = elevators.map(elevator => {
      elevator.goingUpIndicator(true);
      return new ElevatorCtl(elevator);
    });
    var elevatorCtrl = elevatorControllers[0];

    const floorUpPressed = new Set();
    const floorDownPressed = new Set();

    floors.forEach(floor => {
      floor.on("up_button_pressed", function() {
        floorUpPressed.add(floor.floorNum());
      });
      floor.on("down_button_pressed", function() {
        floorDownPressed.add(floor.floorNum());
      });
    });

    elevatorCtrl.elevator.on("passing_floor", function(floorNum, direction) {
      const shouldStopWhenGoingDown =
        elevatorCtrl.elevator.goingDownIndicator() &&
        direction === "down" &&
        floorDownPressed.has(floorNum);

      const shouldStopWhenGoingUp =
        elevatorCtrl.elevator.goingUpIndicator() &&
        direction === "up" &&
        floorUpPressed.has(floorNum);

      if (shouldStopWhenGoingDown) {
        elevatorCtrl.elevator.goToFloor(floorNum, true);
        floorDownPressed.delete(floorNum);
      }

      if (shouldStopWhenGoingUp) {
        elevatorCtrl.elevator.goToFloor(floorNum, true);
        floorUpPressed.delete(floorNum);
      }
    });

    elevatorCtrl.elevator.on("floor_button_pressed", function(floorNum) {
      elevatorCtrl.addFloorToStop(floorNum);
      console.log(
        "on elevator floor button press",
        floorNum,
        elevatorCtrl.floorToStop,
      );
    });

    elevatorCtrl.elevator.on("stopped_at_floor", function(floorNum) {
      console.log("stopped");
      // Maybe decide where to go next?
      elevatorCtrl.removeFloorToStop(floorNum);
      elevatorCtrl.elevator.getPressedFloors().forEach(floorNum => {
        elevatorCtrl.addFloorToStop(floorNum);
      });
      elevatorCtrl.goToNextFloor();
    });

    elevatorCtrl.elevator.on("idle", function() {
      console.log("idle", elevatorCtrl.floorToStop);
      elevatorCtrl.elevator.getPressedFloors().forEach(floorNum => {
        elevatorCtrl.addFloorToStop(floorNum);
      });
      if (floorUpPressed.size && elevatorCtrl.isGoingUp()) {
        const highestFloor = Array.from(floorUpPressed)
          .sort((a, b) => a - b)
          .pop();
        elevatorCtrl.addFloorToStop(highestFloor);
      } else if (floorDownPressed.size && !elevatorCtrl.isGoingUp()) {
        const lowestFloor = Array.from(floorDownPressed)
          .sort((a, b) => a - b)
          .shift();
        elevatorCtrl.addFloorToStop(lowestFloor);
      } else if (floorUpPressed.size || floorDownPressed.size) {
        elevatorCtrl.addFloorToStop(
          [
            ...Array.from(floorUpPressed),
            ...Array.from(floorDownPressed),
          ].pop(),
        );
      }
      elevatorCtrl.goToNextFloor();
    });
  },
  update: function(dt, elevators, floors) {
    // We normally don't need to do anything here
  },
};
