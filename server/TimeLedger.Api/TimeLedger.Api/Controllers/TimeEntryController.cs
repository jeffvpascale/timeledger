using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TimeLedger.Api.Data;
using TimeLedger.Api.Data.Dtos;
using TimeLedger.Api.Data.Entities;

namespace TimeLedger.Api.Controllers
{
	[ApiController]
	[Route("api/time-entry")]
	public class TimeEntryController : ControllerBase
	{
		private readonly TimeLedgerDbContext _db;

		public TimeEntryController(TimeLedgerDbContext db)
		{
			_db = db;
		}

		[HttpGet("{projectId:int}")]
		public async Task<ActionResult<IEnumerable<TimeEntryResponseDto>>> GetTimeEntriesByProjectIdAsync(int projectId)
		{
			var responseDto = await _db.TimeEntries
				.AsNoTracking()
				.Where(te => te.ProjectId == projectId)
				.OrderBy(te => te.Date)
				.Select(te => new TimeEntryResponseDto
				{
					Id = te.Id,
					Date = te.Date,
					Description = te.Description,
					TimeSpent = te.TimeSpent,
					BillingStatus = te.BillingStatus,
				})
				.ToListAsync();

			return Ok(responseDto);
		}

		[HttpGet("{projectId:int}/{timeEntryId:int}", Name = nameof(GetTimeEntryByIdAsync))]
		public async Task<ActionResult<TimeEntryResponseDto>> GetTimeEntryByIdAsync(int projectId, int timeEntryId)
		{
			var responseDto = await _db.TimeEntries
				.AsNoTracking()
				.Where(te => te.ProjectId == projectId && te.Id == timeEntryId)
				.Select(te => new TimeEntryResponseDto
				{
					Id = te.Id,
					Date = te.Date,
					Description = te.Description,
					TimeSpent = te.TimeSpent,
					BillingStatus = te.BillingStatus,
				})
				.FirstOrDefaultAsync();

			if (responseDto == null)
			{
				return NotFound();
			}

			return Ok(responseDto);
		}

		[HttpPost]
		public async Task<ActionResult<TimeEntryResponseDto>> CreateTimeEntryAsync([FromBody] TimeEntryCreateDto timeEntryDto)
		{
			if (timeEntryDto.Date is not DateOnly date)
			{
				return BadRequest("A date is required.");
			}
			TimeEntry newTimeEntry = new TimeEntry
			{

				Date = timeEntryDto.Date.Value,
				Description = timeEntryDto.Description,
				TimeSpent = timeEntryDto.TimeSpent,
				BillingStatus = timeEntryDto.BillingStatus,
				ProjectId = timeEntryDto.ProjectId
			};

			_db.Add(newTimeEntry);
			await _db.SaveChangesAsync();

			var responseDto = new TimeEntryResponseDto
			{
				Id = newTimeEntry.Id,
				Date = newTimeEntry.Date,
				Description = newTimeEntry.Description,
				TimeSpent = newTimeEntry.TimeSpent,
				BillingStatus = newTimeEntry.BillingStatus
			};

			return CreatedAtRoute(
				nameof(GetTimeEntryByIdAsync),
				new { projectId = timeEntryDto.ProjectId, timeEntryId = responseDto.Id },
				responseDto
			);
		}

		[HttpPut("{id:int}")]
		public async Task<ActionResult<TimeEntryResponseDto>> UpdateTimeEntryAsync(int id, [FromBody] TimeEntryUpdateDto timeEntryDto)
		{
			var updateTimeEntry = await _db.TimeEntries.FirstOrDefaultAsync(p => p.Id == id);
			if (updateTimeEntry == null)
			{
				return NotFound();
			}

			if (timeEntryDto.Date is not DateOnly date)
			{
				return BadRequest("A date is required.");
			}
			updateTimeEntry.Date = timeEntryDto.Date.Value;
			updateTimeEntry.Description = timeEntryDto.Description;
			updateTimeEntry.TimeSpent = timeEntryDto.TimeSpent;
			updateTimeEntry.BillingStatus = timeEntryDto.BillingStatus;

			await _db.SaveChangesAsync();

			TimeEntryResponseDto responseDto = new()
			{
				Id = updateTimeEntry.Id,
				Date = updateTimeEntry.Date,
				Description = updateTimeEntry.Description,
				TimeSpent = updateTimeEntry.TimeSpent,
				BillingStatus = updateTimeEntry.BillingStatus,
			};

			return Ok(responseDto);
		}

		[HttpPatch("{id:int}")]
		public async Task<ActionResult<TimeEntryResponseDto>> UpdateBillingStatus(int id, [FromBody] BillingStatus billingStatus)
		{
			var updateTimeEntry = await _db.TimeEntries.FirstOrDefaultAsync(p => p.Id == id);
			if (updateTimeEntry == null)
			{
				return NotFound();
			}

			updateTimeEntry.BillingStatus = billingStatus;

			await _db.SaveChangesAsync();

			TimeEntryResponseDto responseDto = new()
			{
				Id = updateTimeEntry.Id,
				Date = updateTimeEntry.Date,
				Description = updateTimeEntry.Description,
				TimeSpent = updateTimeEntry.TimeSpent,
				BillingStatus = updateTimeEntry.BillingStatus,
			};

			return Ok(responseDto);
		}


		[HttpDelete("{id:int}")]
		public async Task<IActionResult> DeleteTimeEntryAsync(int id)
		{
			var timeEntry = await _db.TimeEntries.FirstOrDefaultAsync(te => te.Id == id);
			if (timeEntry == null)
			{
				return NotFound();
			}

			_db.TimeEntries.Remove(timeEntry);
			await _db.SaveChangesAsync();

			return NoContent();
		}
	}
}
