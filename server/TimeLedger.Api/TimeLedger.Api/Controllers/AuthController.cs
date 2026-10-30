using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TimeLedger.Api.Data.Dtos;
using TimeLedger.Api.Data.Entities;

namespace TimeLedger.Api.Controllers
{
	[ApiController]
	[Route("api/auth")]
	public class AuthController : ControllerBase
	{
		private readonly UserManager<ApplicationUser> _userManager;

		public AuthController(UserManager<ApplicationUser> userManager)
		{
			_userManager = userManager;
		}

		[Authorize]
		[HttpGet("me")]
		public async Task<ActionResult<ApplicationUserResponseDto>> GetUser()
		{
			var user = await _userManager.GetUserAsync(User);

			if (user == null)
			{
				return Unauthorized();
			}

			if (user.Email == null)
			{
				return Problem("User account is missing an email address.");
			}

			var responseDto = new ApplicationUserResponseDto
			{
				Id = user.Id,
				FirstName = user.FirstName,
				LastName = user.LastName,
				Company = user.Company,
				Email = user.Email,
			};
			return Ok(responseDto);
		}

		[HttpPost("register")]
		public async Task<ActionResult> RegisterUser(ApplicationUserRegisterDto registerDto)
		{
			ApplicationUser appUser = new ApplicationUser
			{
				FirstName = registerDto.FirstName,
				LastName = registerDto.LastName,
				Company = registerDto.Company,
				Email = registerDto.Email,
			};
			var result = await _userManager.CreateAsync(appUser, registerDto.Password);

			if (!result.Succeeded)
			{
				return BadRequest(result.Errors);
			}

			return NoContent();
		}

		[Authorize]
		[HttpPatch("details")]
		public async Task<ActionResult<ApplicationUserResponseDto>> UpdateUserAccountDetails(ApplicationUserUpdateAccountDto updateDto)
		{

			var user = await _userManager.GetUserAsync(User);

			if (user == null)
			{
				return Unauthorized();
			}
			if (user.Email == null)
			{
				return Problem("User account is missing an email address.");
			}



			user.FirstName = updateDto.FirstName;
			user.LastName = updateDto.LastName;
			user.Company = updateDto.Company;

			var result = await _userManager.UpdateAsync(user);
			if (!result.Succeeded)
			{
				return BadRequest(result.Errors);
			}

			var userDto = new ApplicationUserResponseDto
			{
				FirstName = updateDto.FirstName,
				LastName = updateDto.LastName,
				Company = updateDto.Company,
				Id = user.Id,
				Email = user.Email
			};

			return Ok(userDto);
		}

		[Authorize]
		[HttpPatch("password")]
		public async Task<ActionResult> UpdateUserAccountPassword(ApplicationUserChangePasswordDto updateDto)
		{
			var user = await _userManager.GetUserAsync(User);
			if (user == null)
			{
				return Unauthorized();
			}

			var result = await _userManager.ChangePasswordAsync(user, updateDto.CurrentPassword, updateDto.NewPassword);

			if (!result.Succeeded)
			{
				return BadRequest(result.Errors);
			}

			return NoContent();
		}
	}
}
